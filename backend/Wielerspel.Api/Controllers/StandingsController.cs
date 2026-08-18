using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.DTOs.Standings;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/competitions/{competitionId:guid}/standings")]
public class StandingsController : ControllerBase
{
    private const int YellowJerseyPoints = 10;
    private const int GreenJerseyPoints = 5;
    private const int PolkaDotJerseyPoints = 5;
    private const int WhiteJerseyPoints = 5;

    private readonly WielerspelDbContext _context;

    public StandingsController(
        WielerspelDbContext context
    )
    {
        _context = context;
    }

    [HttpGet]
    public async Task<
        ActionResult<List<CompetitionStandingDto>>
    > GetStandings(
        Guid competitionId
    )
    {
        var competitionExists =
            await _context.Competitions
                .AsNoTracking()
                .AnyAsync(competition =>
                    competition.Id == competitionId
                );

        if (!competitionExists)
        {
            return NotFound(
                "De competitie werd niet gevonden."
            );
        }

        var competitionUsers =
            await _context.CompetitionUsers
                .AsNoTracking()
                .Where(competitionUser =>
                    competitionUser.CompetitionId ==
                    competitionId
                )
                .Select(competitionUser => new
                {
                    CompetitionUserId =
                        competitionUser.Id,

                    competitionUser.UserId,

                    UserName =
                        competitionUser.User.Name
                })
                .ToListAsync();

        var publishedStages =
            await _context.Stages
                .AsNoTracking()
                .Where(stage =>
                    stage.CompetitionId ==
                        competitionId &&
                    stage.ResultsPublished
                )
                .Select(stage => new
                    {
                        StageId = stage.Id,

                        stage.StageNumber,

                        stage.YellowJerseyCompetitionCyclistId,

                        stage.GreenJerseyCompetitionCyclistId,

                        stage.PolkaDotJerseyCompetitionCyclistId,

                        stage.WhiteJerseyCompetitionCyclistId
                    })
                .ToListAsync();

        var publishedStageIds = publishedStages
            .Select(stage => stage.StageId)
            .ToList();

        var stageResults =
            await _context.StageResults
                .AsNoTracking()
                .Where(stageResult =>
                    publishedStageIds.Contains(
                        stageResult.StageId
                    )
                )
                .Select(stageResult => new
                {
                    stageResult.StageId,

                    stageResult
                        .CompetitionCyclistId,

                    stageResult.Points
                })
                .ToListAsync();

        var playerSelections =
            await _context.CompetitionUserCyclists
                .AsNoTracking()
                .Where(selection =>
                    selection.CompetitionUser
                        .CompetitionId ==
                    competitionId
                )
                .Select(selection => new
                {
                    SelectionId = selection.Id,
                    selection.CompetitionUserId,
                    selection.CompetitionCyclistId,
                    selection.JokerStageId
                })
                .ToListAsync();

        var selectionIds = playerSelections
            .Select(selection => selection.SelectionId)
            .ToList();

        var selectionHistories =
            await _context.CompetitionUserCyclistHistories
                .AsNoTracking()
                .Where(history =>
                    selectionIds.Contains(
                        history.CompetitionUserCyclistId
                    )
                )
                .Select(history => new
                {
                    history.CompetitionUserCyclistId,
                    history.CompetitionCyclistId,
                    history.FromStageNumber,
                    history.ToStageNumber
                })
                .ToListAsync();
        
        var stageResultPointsByCyclistAndStage =
            stageResults.ToDictionary(
                result => (
                    result.CompetitionCyclistId,
                    result.StageId
                ),
                result => result.Points
            );

        
       var pointTotals = playerSelections
        .GroupBy(selection =>
            selection.CompetitionUserId
        )
        .ToDictionary(
            group => group.Key,
            group => group.Sum(selection =>
                CalculateSelectionPoints(
                    selection.SelectionId,
                    selection.CompetitionCyclistId,
                    selection.JokerStageId,
                    publishedStages
                        .Select(stage => (
                            stage.StageId,
                            stage.StageNumber,
                            stage.YellowJerseyCompetitionCyclistId,
                            stage.GreenJerseyCompetitionCyclistId,
                            stage.PolkaDotJerseyCompetitionCyclistId,
                            stage.WhiteJerseyCompetitionCyclistId
                        )),
                    stageResultPointsByCyclistAndStage,
                    selectionHistories
                        .Where(history =>
                            history
                                .CompetitionUserCyclistId ==
                            selection.SelectionId
                        )
                        .Select(history => (
                            history.CompetitionCyclistId,
                            history.FromStageNumber,
                            history.ToStageNumber
                        ))
                )
            )
        );

        var standings = competitionUsers
            .Select(competitionUser =>
                new CompetitionStandingDto
                {
                    UserId =
                        competitionUser.UserId,

                    UserName =
                        competitionUser.UserName,

                    TotalPoints =
                        pointTotals.GetValueOrDefault(
                            competitionUser
                                .CompetitionUserId
                        )
                }
            )
            .OrderByDescending(standing =>
                standing.TotalPoints
            )
            .ThenBy(standing =>
                standing.UserName
            )
            .ToList();

        return Ok(standings);
    }

    [HttpGet("{userId:guid}")]
    public async Task<
        ActionResult<PlayerStandingDetailDto>
    > GetPlayerStandingDetails(
        Guid competitionId,
        Guid userId
    )
    {
        var competition =
            await _context.Competitions
                .AsNoTracking()
                .Where(competition =>
                    competition.Id == competitionId
                )
                .Select(competition => new
                {
                    competition.Id,
                    competition.TeamLockDate
                })
                .FirstOrDefaultAsync();

        if (competition is null)
        {
            return NotFound(
                "De competitie werd niet gevonden."
            );
        }

        var competitionUser =
            await _context.CompetitionUsers
                .AsNoTracking()
                .Where(competitionUser =>
                    competitionUser.CompetitionId ==
                        competitionId &&
                    competitionUser.UserId == userId
                )
                .Select(competitionUser => new
                {
                    CompetitionUserId =
                        competitionUser.Id,

                    competitionUser.UserId,

                    UserName =
                        competitionUser.User.Name
                })
                .FirstOrDefaultAsync();

        if (competitionUser is null)
        {
            return NotFound(
                "De speler werd niet gevonden " +
                "in deze competitie."
            );
        }

        var publishedStages =
            await _context.Stages
                .AsNoTracking()
                .Where(stage =>
                    stage.CompetitionId ==
                        competitionId &&
                    stage.ResultsPublished
                )
                .OrderBy(stage =>
                    stage.StageNumber
                )
                .Select(stage => new
                {
                    StageId = stage.Id,
                    stage.StageNumber,

                    stage.YellowJerseyCompetitionCyclistId,

                    stage.GreenJerseyCompetitionCyclistId,

                    stage.PolkaDotJerseyCompetitionCyclistId,

                    stage.WhiteJerseyCompetitionCyclistId
                })
                .ToListAsync();

        var playerSelections =
            await _context.CompetitionUserCyclists
                .AsNoTracking()
                .Where(selection =>
                    selection.CompetitionUserId ==
                    competitionUser
                        .CompetitionUserId
                )
                .Select(selection => new
                {
                    SelectionId = selection.Id,
                    selection.CompetitionCyclistId,
                    selection.JokerStageId
                })
                .ToListAsync();

        var selectionIds = playerSelections
            .Select(selection => selection.SelectionId)
            .ToList();

        var selectionHistories =
            await _context.CompetitionUserCyclistHistories
                .AsNoTracking()
                .Where(history =>
                    selectionIds.Contains(
                        history.CompetitionUserCyclistId
                    )
                )
                .Select(history => new
                {
                    history.CompetitionUserCyclistId,
                    history.CompetitionCyclistId,
                    history.FromStageNumber,
                    history.ToStageNumber
                })
                .ToListAsync();

        var publishedStageIds = publishedStages
            .Select(stage => stage.StageId)
            .ToList();

        var relevantCyclistIds = playerSelections
            .Select(selection =>
                selection.CompetitionCyclistId
            )
            .Concat(
                selectionHistories.Select(history =>
                    history.CompetitionCyclistId
                )
            )
            .Distinct()
            .ToList();

        var playerStageResults =
            await _context.StageResults
                .AsNoTracking()
                .Where(stageResult =>
                    publishedStageIds.Contains(
                        stageResult.StageId
                    ) &&
                    relevantCyclistIds.Contains(
                        stageResult.CompetitionCyclistId
                    )
                )
                .Select(stageResult => new
                {
                    stageResult.StageId,
                    stageResult.CompetitionCyclistId,
                    stageResult.Points
                })
                .ToListAsync();

        var stageResultPointsByCyclistAndStage =
            playerStageResults.ToDictionary(
                result => (
                    result.CompetitionCyclistId,
                    result.StageId
                ),
                result => result.Points
            );

        var historiesBySelectionId =
            selectionHistories
                .GroupBy(history =>
                    history.CompetitionUserCyclistId
                )
                .ToDictionary(
                    group => group.Key,
                    group => group.ToList()
                );

        var stagePoints = publishedStages
            .Select(stage =>
            {
                var stageResultPoints = 0;
                var jokerPoints = 0;

                var yellowPoints = 0;
                var greenPoints = 0;
                var polkaDotPoints = 0;
                var whitePoints = 0;

                foreach (var selection in playerSelections)
                {
                    historiesBySelectionId.TryGetValue(
                        selection.SelectionId,
                        out var histories
                    );

                    var activeCompetitionCyclistId =
                        selection.CompetitionCyclistId;

                    if (histories != null)
                    {
                        var activeHistory =
                            histories.FirstOrDefault(history =>
                                stage.StageNumber >=
                                    history.FromStageNumber &&
                                (
                                    !history.ToStageNumber.HasValue ||
                                    stage.StageNumber <=
                                        history.ToStageNumber.Value
                                )
                            );

                        if (activeHistory != null)
                        {
                            activeCompetitionCyclistId =
                                activeHistory
                                    .CompetitionCyclistId;
                        }
                    }

                    var cyclistStagePoints =
                        stageResultPointsByCyclistAndStage
                            .GetValueOrDefault(
                                (
                                    activeCompetitionCyclistId,
                                    stage.StageId
                                )
                            );

                    stageResultPoints +=
                        cyclistStagePoints;

                    // De joker blijft aan de vaste selectieplek
                    // gekoppeld. Alleen de renner die op dat
                    // moment op die plek zit krijgt de bonus.
                    if (
                        selection.JokerStageId.HasValue &&
                        selection.JokerStageId.Value ==
                            stage.StageId
                    )
                    {
                        jokerPoints +=
                            cyclistStagePoints;
                    }

                    if (
                        stage
                            .YellowJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        yellowPoints +=
                            YellowJerseyPoints;
                    }

                    if (
                        stage
                            .GreenJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        greenPoints +=
                            GreenJerseyPoints;
                    }

                    if (
                        stage
                            .PolkaDotJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        polkaDotPoints +=
                            PolkaDotJerseyPoints;
                    }

                    if (
                        stage
                            .WhiteJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        whitePoints +=
                            WhiteJerseyPoints;
                    }
                }

                return new StageStandingPointsDto
                {
                    StageId = stage.StageId,

                    StageNumber =
                        stage.StageNumber,

                    StageResultPoints =
                        stageResultPoints,

                    JokerPoints =
                        jokerPoints,

                    YellowJerseyPoints =
                        yellowPoints,

                    GreenJerseyPoints =
                        greenPoints,

                    PolkaDotJerseyPoints =
                        polkaDotPoints,

                    WhiteJerseyPoints =
                        whitePoints
                };
            })
            .ToList();

        var teamVisible =
            DateTime.UtcNow >=
            GetUtcDateTime(
                competition.TeamLockDate
            );

        var cyclists =
            new List<PlayerTeamCyclistDto>();

        if (teamVisible)
        {
            cyclists =
                await _context
                    .CompetitionUserCyclists
                    .AsNoTracking()
                    .Where(selection =>
                        selection.CompetitionUserId ==
                        competitionUser
                            .CompetitionUserId
                    )
                    .Select(selection =>
                        new PlayerTeamCyclistDto
                        {
                            CompetitionCyclistId =
                                selection
                                    .CompetitionCyclistId,

                            CyclistId =
                                selection
                                    .CompetitionCyclist
                                    .CyclistId,

                            CyclistName =
                                selection
                                    .CompetitionCyclist
                                    .Cyclist
                                    .Name,

                            TeamId =
                                selection
                                    .CompetitionCyclist
                                    .Cyclist
                                    .TeamId,

                            TeamName =
                                selection
                                        .CompetitionCyclist
                                        .Cyclist
                                        .Team != null
                                    ? selection
                                        .CompetitionCyclist
                                        .Cyclist
                                        .Team!
                                        .Name
                                    : string.Empty,

                            Price =
                                selection
                                    .CompetitionCyclist
                                    .Price
                        }
                    )
                    .ToListAsync();
        }

        var result =
            new PlayerStandingDetailDto
            {
                UserId =
                    competitionUser.UserId,

                UserName =
                    competitionUser.UserName,

                TotalPoints =
                    stagePoints.Sum(
                        stage => stage.Points
                    ),

                TeamLockDate =
                    competition.TeamLockDate,

                TeamVisible =
                    teamVisible,

                StagePoints =
                    stagePoints,

                Cyclists =
                    cyclists
            };

        return Ok(result);
    }

    private static int CalculateSelectionPoints(
        Guid selectionId,
        Guid currentCompetitionCyclistId,
        Guid? jokerStageId,
        IEnumerable<(
            Guid StageId,
            int StageNumber,
            Guid? YellowJerseyCompetitionCyclistId,
            Guid? GreenJerseyCompetitionCyclistId,
            Guid? PolkaDotJerseyCompetitionCyclistId,
            Guid? WhiteJerseyCompetitionCyclistId
        )> publishedStages,
        IReadOnlyDictionary<
            (Guid CompetitionCyclistId, Guid StageId),
            int
        > stageResultPointsByCyclistAndStage,
        IEnumerable<(
            Guid CompetitionCyclistId,
            int FromStageNumber,
            int? ToStageNumber
        )> histories
    )
    {
        var totalPoints = 0;

        var historyList = histories.ToList();

        foreach (var stage in publishedStages)
        {
            var history = historyList
                .FirstOrDefault(item =>
                    stage.StageNumber >=
                        item.FromStageNumber &&
                    (
                        !item.ToStageNumber.HasValue ||
                        stage.StageNumber <=
                            item.ToStageNumber.Value
                    )
                );

            var activeCompetitionCyclistId =
                history.CompetitionCyclistId != Guid.Empty
                    ? history.CompetitionCyclistId
                    : currentCompetitionCyclistId;

            var stageResultPoints =
                stageResultPointsByCyclistAndStage
                    .GetValueOrDefault(
                        (
                            activeCompetitionCyclistId,
                            stage.StageId
                        )
                    );

            totalPoints += stageResultPoints;

            if (
                jokerStageId.HasValue &&
                jokerStageId.Value == stage.StageId
            )
            {
                totalPoints += stageResultPoints;
            }

            if (
                stage.YellowJerseyCompetitionCyclistId ==
                activeCompetitionCyclistId
            )
            {
                totalPoints += YellowJerseyPoints;
            }

            if (
                stage.GreenJerseyCompetitionCyclistId ==
                activeCompetitionCyclistId
            )
            {
                totalPoints += GreenJerseyPoints;
            }

            if (
                stage.PolkaDotJerseyCompetitionCyclistId ==
                activeCompetitionCyclistId
            )
            {
                totalPoints += PolkaDotJerseyPoints;
            }

            if (
                stage.WhiteJerseyCompetitionCyclistId ==
                activeCompetitionCyclistId
            )
            {
                totalPoints += WhiteJerseyPoints;
            }
        }

        return totalPoints;
    }

    private static bool HasCyclist(
        ISet<Guid> playerCyclistIds,
        Guid? competitionCyclistId
    )
    {
        return
            competitionCyclistId.HasValue &&
            playerCyclistIds.Contains(
                competitionCyclistId.Value
            );
    }

    private static void AddPoints(
        IDictionary<Guid, int> pointsByCyclist,
        Guid? competitionCyclistId,
        int points
    )
    {
        if (!competitionCyclistId.HasValue)
        {
            return;
        }

        var cyclistId =
            competitionCyclistId.Value;

        pointsByCyclist.TryGetValue(
            cyclistId,
            out var currentPoints
        );

        pointsByCyclist[cyclistId] =
            currentPoints + points;
    }

    private static DateTime GetUtcDateTime(
        DateTime value
    )
    {
        return value.Kind switch
        {
            DateTimeKind.Utc =>
                value,

            DateTimeKind.Local =>
                value.ToUniversalTime(),

            _ =>
                DateTime.SpecifyKind(
                    value,
                    DateTimeKind.Utc
                )
        };
    }
}
