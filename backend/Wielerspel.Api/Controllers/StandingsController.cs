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

                    stage
                        .YellowJerseyCompetitionCyclistId,

                    stage
                        .GreenJerseyCompetitionCyclistId,

                    stage
                        .PolkaDotJerseyCompetitionCyclistId
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
                    selection.CompetitionUserId,
                    selection.CompetitionCyclistId,
                    selection.JokerStageId
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

        var jerseyPointsByCyclist =
            new Dictionary<Guid, int>();

        foreach (var stage in publishedStages)
        {
            AddPoints(
                jerseyPointsByCyclist,
                stage
                    .YellowJerseyCompetitionCyclistId,
                YellowJerseyPoints
            );

            AddPoints(
                jerseyPointsByCyclist,
                stage
                    .GreenJerseyCompetitionCyclistId,
                GreenJerseyPoints
            );

            AddPoints(
                jerseyPointsByCyclist,
                stage
                    .PolkaDotJerseyCompetitionCyclistId,
                PolkaDotJerseyPoints
            );
        }

        var pointTotals = playerSelections
            .GroupBy(selection =>
                selection.CompetitionUserId
            )
            .ToDictionary(
                group => group.Key,
                group => group.Sum(selection =>
                    CalculateSelectionPoints(
                        selection.CompetitionCyclistId,
                        selection.JokerStageId,
                        publishedStageIds,
                        stageResultPointsByCyclistAndStage,
                        jerseyPointsByCyclist
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

                    stage
                        .YellowJerseyCompetitionCyclistId,

                    stage
                        .GreenJerseyCompetitionCyclistId,

                    stage
                        .PolkaDotJerseyCompetitionCyclistId
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
                    selection.CompetitionCyclistId,
                    selection.JokerStageId
                })
                .ToListAsync();

        var playerCyclistIds = playerSelections
            .Select(selection =>
                selection.CompetitionCyclistId
            )
            .ToList();

        var playerCyclistIdSet =
            playerCyclistIds.ToHashSet();

        var publishedStageIds = publishedStages
            .Select(stage => stage.StageId)
            .ToList();

        var playerStageResults =
            await _context.StageResults
                .AsNoTracking()
                .Where(stageResult =>
                    publishedStageIds.Contains(
                        stageResult.StageId
                    ) &&
                    playerCyclistIds.Contains(
                        stageResult
                            .CompetitionCyclistId
                    )
                )
                .Select(stageResult => new
                {
                    stageResult.StageId,
                    stageResult.CompetitionCyclistId,
                    stageResult.Points
                })
                .ToListAsync();

        var stageResultPointsByStage =
            playerStageResults
                .GroupBy(result => result.StageId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Sum(
                        result => result.Points
                    )
                );

        var jokerPointsByStage =
            playerStageResults
                .Join(
                    playerSelections.Where(selection =>
                        selection.JokerStageId.HasValue
                    ),
                    result => new
                    {
                        result.CompetitionCyclistId,
                        StageId = result.StageId
                    },
                    selection => new
                    {
                        selection.CompetitionCyclistId,
                        StageId =
                            selection.JokerStageId!.Value
                    },
                    (result, selection) => result
                )
                .GroupBy(result => result.StageId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Sum(
                        result => result.Points
                    )
                );

        var stagePoints = publishedStages
            .Select(stage =>
            {
                var yellowPoints =
                    HasCyclist(
                        playerCyclistIdSet,
                        stage
                            .YellowJerseyCompetitionCyclistId
                    )
                        ? YellowJerseyPoints
                        : 0;

                var greenPoints =
                    HasCyclist(
                        playerCyclistIdSet,
                        stage
                            .GreenJerseyCompetitionCyclistId
                    )
                        ? GreenJerseyPoints
                        : 0;

                var polkaDotPoints =
                    HasCyclist(
                        playerCyclistIdSet,
                        stage
                            .PolkaDotJerseyCompetitionCyclistId
                    )
                        ? PolkaDotJerseyPoints
                        : 0;

                return new StageStandingPointsDto
                {
                    StageId = stage.StageId,

                    StageNumber =
                        stage.StageNumber,

                    StageResultPoints =
                        stageResultPointsByStage
                            .GetValueOrDefault(
                                stage.StageId
                            ),

                    JokerPoints =
                        jokerPointsByStage
                            .GetValueOrDefault(
                                stage.StageId
                            ),

                    YellowJerseyPoints =
                        yellowPoints,

                    GreenJerseyPoints =
                        greenPoints,

                    PolkaDotJerseyPoints =
                        polkaDotPoints
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
        Guid competitionCyclistId,
        Guid? jokerStageId,
        IEnumerable<Guid> publishedStageIds,
        IReadOnlyDictionary<
            (Guid CompetitionCyclistId, Guid StageId),
            int
        > stageResultPointsByCyclistAndStage,
        IReadOnlyDictionary<Guid, int>
            jerseyPointsByCyclist
    )
    {
        var stageResultPoints = 0;
        var jokerPoints = 0;

        foreach (var stageId in publishedStageIds)
        {
            var points =
                stageResultPointsByCyclistAndStage
                    .GetValueOrDefault(
                        (
                            competitionCyclistId,
                            stageId
                        )
                    );

            stageResultPoints += points;

            if (
                jokerStageId.HasValue &&
                jokerStageId.Value == stageId
            )
            {
                jokerPoints += points;
            }
        }

        var jerseyPoints =
            jerseyPointsByCyclist
                .GetValueOrDefault(
                    competitionCyclistId
                );

        return
            stageResultPoints +
            jokerPoints +
            jerseyPoints;
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
