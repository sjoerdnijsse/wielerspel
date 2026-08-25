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
                        competitionUser.User.Name,

                    competitionUser.TransfersUsed
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

                        stage.NoResult,

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
                        ),

                    TransfersUsed =
                        competitionUser.TransfersUsed
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
                            competitionUser.User.Name,

                        competitionUser.TransfersUsed
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
                    stage.NoResult,

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

        var transferCyclistIds =
                selectionHistories
                    .Select(history =>
                        history.CompetitionCyclistId
                    )
                    .Distinct()
                    .ToList();

            var transferCyclistNames =
                await _context.CompetitionCyclists
                    .AsNoTracking()
                    .Where(competitionCyclist =>
                        transferCyclistIds.Contains(
                            competitionCyclist.Id
                        )
                    )
                    .Select(competitionCyclist => new
                    {
                        competitionCyclist.Id,

                        Name =
                            competitionCyclist.Cyclist.Name
                    })
                    .ToDictionaryAsync(
                        competitionCyclist =>
                            competitionCyclist.Id,
                        competitionCyclist =>
                            competitionCyclist.Name
                    );

            var transfers =
                new List<PlayerTransferDto>();

            foreach (var historyGroup in
                selectionHistories.GroupBy(history =>
                    history.CompetitionUserCyclistId
                ))
            {
                var playerSelection =
                    playerSelections.First(selection =>
                        selection.SelectionId ==
                        historyGroup.Key
                    );

                var orderedHistories =
                    historyGroup
                        .OrderBy(history =>
                            history.FromStageNumber
                        )
                        .ToList();

                for (
                    var index = 0;
                    index < orderedHistories.Count - 1;
                    index++
                )
                {
                    var outgoingHistory =
                        orderedHistories[index];

                    var incomingHistory =
                        orderedHistories[index + 1];

                    if (!outgoingHistory.ToStageNumber.HasValue)
                    {
                        continue;
                    }

                    var outgoingCyclistPoints =
                        publishedStages
                            .Where(stage =>
                                stage.StageNumber >=
                                    outgoingHistory.FromStageNumber &&
                                stage.StageNumber <=
                                    outgoingHistory.ToStageNumber.Value
                            )
                            .Sum(stage =>
                            {
                                var stagePoints =
                                    stageResultPointsByCyclistAndStage
                                        .GetValueOrDefault(
                                            (
                                                outgoingHistory
                                                    .CompetitionCyclistId,
                                                stage.StageId
                                            )
                                        );

                                var totalPoints = stagePoints;

                                if (
                                    playerSelection.JokerStageId.HasValue &&
                                    playerSelection.JokerStageId.Value ==
                                        stage.StageId
                                )
                                {
                                    totalPoints += stagePoints;
                                }

                                if (
                                    stage.YellowJerseyCompetitionCyclistId ==
                                    outgoingHistory.CompetitionCyclistId
                                )
                                {
                                    totalPoints += YellowJerseyPoints;
                                }

                                if (
                                    stage.GreenJerseyCompetitionCyclistId ==
                                    outgoingHistory.CompetitionCyclistId
                                )
                                {
                                    totalPoints += GreenJerseyPoints;
                                }

                                if (
                                    stage.PolkaDotJerseyCompetitionCyclistId ==
                                    outgoingHistory.CompetitionCyclistId
                                )
                                {
                                    totalPoints += PolkaDotJerseyPoints;
                                }

                                if (
                                    stage.WhiteJerseyCompetitionCyclistId ==
                                    outgoingHistory.CompetitionCyclistId
                                )
                                {
                                    totalPoints += WhiteJerseyPoints;
                                }

                                return totalPoints;
                            });

                    transfers.Add(
                        new PlayerTransferDto
                        {
                            AfterStageNumber =
                                outgoingHistory
                                    .ToStageNumber.Value,

                            OutgoingCyclistName =
                                transferCyclistNames
                                    .GetValueOrDefault(
                                        outgoingHistory
                                            .CompetitionCyclistId,
                                        "Onbekende renner"
                                    ),

                            IncomingCyclistName =
                                transferCyclistNames
                                    .GetValueOrDefault(
                                        incomingHistory
                                            .CompetitionCyclistId,
                                        "Onbekende renner"
                                    ),

                            OutgoingCyclistPoints =
                                outgoingCyclistPoints
                        }
                    );
                }
            }

            transfers = transfers
                .OrderBy(transfer =>
                    transfer.AfterStageNumber
                )
                .ThenBy(transfer =>
                    transfer.OutgoingCyclistName
                )
                .ToList();

        var cyclistDetailsByCompetitionCyclistId =
            await _context.CompetitionCyclists
                .AsNoTracking()
                .Where(competitionCyclist =>
                    relevantCyclistIds.Contains(
                        competitionCyclist.Id
                    )
                )
                .Select(competitionCyclist => new
                {
                    competitionCyclist.Id,

                    CyclistName =
                        competitionCyclist
                            .Cyclist
                            .Name,

                    TeamName =
                        competitionCyclist
                            .Cyclist
                            .Team != null
                            ? competitionCyclist
                                .Cyclist
                                .Team!
                                .Name
                            : string.Empty,

                    JerseyImageUrl =
                        competitionCyclist
                            .Cyclist
                            .Team != null
                            ? competitionCyclist
                                .Cyclist
                                .Team!
                                .JerseyImageUrl
                            : null
                })
                .ToDictionaryAsync(
                    competitionCyclist =>
                        competitionCyclist.Id
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

                var stageCyclists =
                    new List<StageCyclistPointsDto>();

                foreach (var selection in playerSelections)
                {
                    historiesBySelectionId.TryGetValue(
                        selection.SelectionId,
                        out var histories
                    );

                    var activeCompetitionCyclistId =
                        selection.CompetitionCyclistId;

                    if (histories != null && histories.Count > 0)
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

                        if (activeHistory == null)
                        {
                            // Deze selectie was tijdens deze etappe
                            // nog niet actief.
                            continue;
                        }

                        activeCompetitionCyclistId =
                            activeHistory.CompetitionCyclistId;
                    }

                    var cyclistStageResultPoints =
                        stageResultPointsByCyclistAndStage
                            .GetValueOrDefault(
                                (
                                    activeCompetitionCyclistId,
                                    stage.StageId
                                )
                            );

                    var cyclistTotalPoints =
                        cyclistStageResultPoints;

                    stageResultPoints +=
                        cyclistStageResultPoints;

                    // Jokerbonus
                    if (
                        selection.JokerStageId.HasValue &&
                        selection.JokerStageId.Value ==
                            stage.StageId
                    )
                    {
                        jokerPoints +=
                            cyclistStageResultPoints;

                        cyclistTotalPoints +=
                            cyclistStageResultPoints;
                    }

                    // Gele trui
                    if (
                        stage
                            .YellowJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        yellowPoints +=
                            YellowJerseyPoints;

                        cyclistTotalPoints +=
                            YellowJerseyPoints;
                    }

                    // Groene trui
                    if (
                        stage
                            .GreenJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        greenPoints +=
                            GreenJerseyPoints;

                        cyclistTotalPoints +=
                            GreenJerseyPoints;
                    }

                    // Bollentrui
                    if (
                        stage
                            .PolkaDotJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        polkaDotPoints +=
                            PolkaDotJerseyPoints;

                        cyclistTotalPoints +=
                            PolkaDotJerseyPoints;
                    }

                    // Witte trui
                    if (
                        stage
                            .WhiteJerseyCompetitionCyclistId ==
                        activeCompetitionCyclistId
                    )
                    {
                        whitePoints +=
                            WhiteJerseyPoints;

                        cyclistTotalPoints +=
                            WhiteJerseyPoints;
                    }

                    if (
                        cyclistDetailsByCompetitionCyclistId
                            .TryGetValue(
                                activeCompetitionCyclistId,
                                out var cyclistDetails
                            )
                    )
                    {
                        stageCyclists.Add(
                            new StageCyclistPointsDto
                            {
                                CompetitionCyclistId =
                                    activeCompetitionCyclistId,

                                CyclistName =
                                    cyclistDetails.CyclistName,

                                TeamName =
                                    cyclistDetails.TeamName,

                                JerseyImageUrl =
                                    cyclistDetails.JerseyImageUrl,

                                Points =
                                    cyclistTotalPoints
                            }
                        );
                    }
                }

                return new StageStandingPointsDto
                {
                    StageId =
                        stage.StageId,

                    StageNumber =
                        stage.StageNumber,

                    NoResult =
                        stage.NoResult,

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
                        whitePoints,

                    Cyclists =
                        stageCyclists
                            .OrderByDescending(cyclist =>
                                cyclist.Points
                            )
                            .ThenBy(cyclist =>
                                cyclist.CyclistName
                            )
                            .ToList()
                };
            })
            .ToList();

        var pointsByCyclist =
            new Dictionary<Guid, int>();

        foreach (var stage in publishedStages)
        {
            foreach (var selection in playerSelections)
            {
                historiesBySelectionId.TryGetValue(
                    selection.SelectionId,
                    out var histories
                );

                var activeCompetitionCyclistId =
                    selection.CompetitionCyclistId;

                if (histories != null && histories.Count > 0)
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

                    if (activeHistory == null)
                    {
                        continue;
                    }

                    activeCompetitionCyclistId =
                        activeHistory.CompetitionCyclistId;
                }

                var cyclistStagePoints =
                    stageResultPointsByCyclistAndStage
                        .GetValueOrDefault(
                            (
                                activeCompetitionCyclistId,
                                stage.StageId
                            )
                        );

                var cyclistPoints =
                    cyclistStagePoints;

                // Jokerbonus
                if (
                    selection.JokerStageId.HasValue &&
                    selection.JokerStageId.Value ==
                        stage.StageId
                )
                {
                    cyclistPoints +=
                        cyclistStagePoints;
                }

                // Gele trui
                if (
                    stage
                        .YellowJerseyCompetitionCyclistId ==
                    activeCompetitionCyclistId
                )
                {
                    cyclistPoints +=
                        YellowJerseyPoints;
                }

                // Groene trui
                if (
                    stage
                        .GreenJerseyCompetitionCyclistId ==
                    activeCompetitionCyclistId
                )
                {
                    cyclistPoints +=
                        GreenJerseyPoints;
                }

                // Bollentrui
                if (
                    stage
                        .PolkaDotJerseyCompetitionCyclistId ==
                    activeCompetitionCyclistId
                )
                {
                    cyclistPoints +=
                        PolkaDotJerseyPoints;
                }

                // Witte trui
                if (
                    stage
                        .WhiteJerseyCompetitionCyclistId ==
                    activeCompetitionCyclistId
                )
                {
                    cyclistPoints +=
                        WhiteJerseyPoints;
                }

                AddPoints(
                    pointsByCyclist,
                    activeCompetitionCyclistId,
                    cyclistPoints
                );
            }
        }
        
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

                                JerseyImageUrl =
                                    selection
                                            .CompetitionCyclist
                                            .Cyclist
                                            .Team != null
                                        ? selection
                                            .CompetitionCyclist
                                            .Cyclist
                                            .Team!
                                            .JerseyImageUrl
                                        : null,

                                Price =
                                    selection
                                        .CompetitionCyclist
                                        .Price,

                                JokerStageNumber =
                                    selection.JokerStageId.HasValue
                                        ? _context.Stages
                                            .Where(stage =>
                                                stage.Id ==
                                                selection.JokerStageId.Value
                                            )
                                            .Select(stage =>
                                                (int?)stage.StageNumber
                                            )
                                            .FirstOrDefault()
                                        : null
                            }
                        )
                        .ToListAsync();
            foreach (var cyclist in cyclists)
                {
                    cyclist.Points =
                        pointsByCyclist.GetValueOrDefault(
                            cyclist.CompetitionCyclistId
                        );
                }            
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

                TransfersUsed =
                    competitionUser.TransfersUsed,

                TeamLockDate =
                    competition.TeamLockDate,

                TeamVisible =
                    teamVisible,

                StagePoints =
                    stagePoints,

                Cyclists =
                    cyclists,

                Transfers =
                    transfers
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

            // Als deze selectie historie heeft, maar nog geen
            // actieve periode voor deze etappe, bestond de
            // selectie op dat moment nog niet.
            // Dit geldt bijvoorbeeld voor een late instromer.
            if (
                historyList.Count > 0 &&
                history.CompetitionCyclistId == Guid.Empty
            )
            {
                continue;
            }

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
