using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/competitions")]
[Authorize]
public class CompetitionsController : ControllerBase
{
    private const int YellowJerseyPoints = 10;
    private const int GreenJerseyPoints = 5;
    private const int PolkaDotJerseyPoints = 5;

    private readonly WielerspelDbContext _context;

    public CompetitionsController(
        WielerspelDbContext context
    )
    {
        _context = context;
    }

    // Iedere ingelogde gebruiker mag actieve competities bekijken.
    [HttpGet]
    public async Task<IActionResult> GetCompetitions()
    {
        var competitions = await _context.Competitions
            .AsNoTracking()
            .Where(competition =>
                competition.IsActive &&
                !competition.IsFinished
            )
            .OrderByDescending(competition =>
                competition.Year
            )
            .ThenBy(competition =>
                competition.Name
            )
            .ToListAsync();

        return Ok(competitions);
    }

    // Alleen moderators mogen alle competities bekijken,
    // inclusief niet-actieve en afgeronde competities.
    [HttpGet("admin")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetCompetitionsForAdmin()
    {
        var competitions = await _context.Competitions
            .AsNoTracking()
            .OrderByDescending(competition =>
                competition.Year
            )
            .ThenBy(competition =>
                competition.Name
            )
            .ToListAsync();

        return Ok(competitions);
    }

    // Alleen moderators mogen de deelnemers van een
    // competitie bekijken.
    [HttpGet("{id:guid}/participants")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetCompetitionParticipants(
        Guid id
    )
    {
        var competitionExists = await _context.Competitions
            .AsNoTracking()
            .AnyAsync(competition =>
                competition.Id == id
            );

        if (!competitionExists)
        {
            return NotFound(
                "Wedstrijd niet gevonden."
            );
        }

        var participants = await _context.CompetitionUsers
            .AsNoTracking()
            .Where(competitionUser =>
                competitionUser.CompetitionId == id
            )
            .Include(competitionUser =>
                competitionUser.User
            )
            .OrderBy(competitionUser =>
                competitionUser.User.Name
            )
            .ThenBy(competitionUser =>
                competitionUser.User.Email
            )
            .Select(competitionUser => new
            {
                competitionUser.Id,
                competitionUser.UserId,
                competitionUser.CompetitionId,

                Name = competitionUser.User.Name,
                Email = competitionUser.User.Email
            })
            .ToListAsync();

        return Ok(participants);
    }

    // Alleen moderators mogen een competitie toevoegen.
    [HttpPost]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> CreateCompetition(
        Competition competition
    )
    {
        var validationResult =
            ValidateCompetition(competition);

        if (validationResult != null)
        {
            return validationResult;
        }

        var name = competition.Name.Trim();

        var duplicateExists =
            await _context.Competitions
                .AnyAsync(existingCompetition =>
                    existingCompetition.Name
                        .ToLower() ==
                    name.ToLower() &&
                    existingCompetition.Year ==
                    competition.Year
                );

        if (duplicateExists)
        {
            return BadRequest(
                "Er bestaat al een wedstrijd met deze naam en dit jaar."
            );
        }

        var newCompetition = new Competition
        {
            Id = Guid.NewGuid(),
            Name = name,
            Year = competition.Year,
            TeamSize = competition.TeamSize,
            Budget = competition.Budget,
            MaxTransfers = competition.MaxTransfers,
            TeamLockDate = competition.TeamLockDate,
            IsActive = competition.IsActive,
            IsFinished = false,
            FinishedAt = null
        };

        _context.Competitions.Add(
            newCompetition
        );

        await _context.SaveChangesAsync();

        return Ok(newCompetition);
    }

    // Alleen moderators mogen een competitie wijzigen.
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UpdateCompetition(
        Guid id,
        Competition competition
    )
    {
        var existingCompetition =
            await _context.Competitions
                .FirstOrDefaultAsync(item =>
                    item.Id == id
                );

        if (existingCompetition == null)
        {
            return NotFound(
                "Wedstrijd niet gevonden."
            );
        }

        if (existingCompetition.IsFinished)
        {
            return BadRequest(
                "Een afgeronde wedstrijd kan niet meer worden gewijzigd."
            );
        }

        var validationResult =
            ValidateCompetition(competition);

        if (validationResult != null)
        {
            return validationResult;
        }

        var name = competition.Name.Trim();

        var duplicateExists =
            await _context.Competitions
                .AnyAsync(otherCompetition =>
                    otherCompetition.Id != id &&
                    otherCompetition.Name
                        .ToLower() ==
                    name.ToLower() &&
                    otherCompetition.Year ==
                    competition.Year
                );

        if (duplicateExists)
        {
            return BadRequest(
                "Er bestaat al een wedstrijd met deze naam en dit jaar."
            );
        }

        existingCompetition.Name = name;
        existingCompetition.Year =
            competition.Year;
        existingCompetition.TeamSize =
            competition.TeamSize;
        existingCompetition.Budget =
            competition.Budget;
        existingCompetition.MaxTransfers =
            competition.MaxTransfers;
        existingCompetition.TeamLockDate =
            competition.TeamLockDate;
        existingCompetition.IsActive =
            competition.IsActive;

        await _context.SaveChangesAsync();

        return Ok(existingCompetition);
    }

    // Een competitie definitief afronden en het
    // eindklassement als snapshot opslaan.
    [HttpPut("{id:guid}/finalize")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> FinalizeCompetition(
        Guid id
    )
    {
        var competition =
            await _context.Competitions
                .FirstOrDefaultAsync(item =>
                    item.Id == id
                );

        if (competition == null)
        {
            return NotFound(
                "Wedstrijd niet gevonden."
            );
        }

        if (competition.IsFinished)
        {
            return BadRequest(
                "Deze wedstrijd is al afgerond."
            );
        }

        var competitionUsers =
            await _context.CompetitionUsers
                .AsNoTracking()
                .Where(competitionUser =>
                    competitionUser.CompetitionId == id
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

        if (competitionUsers.Count == 0)
        {
            return BadRequest(
                "De wedstrijd kan niet worden afgerond omdat er geen deelnemers zijn."
            );
        }

        var stages = await _context.Stages
            .AsNoTracking()
            .Where(stage =>
                stage.CompetitionId == id
            )
            .Select(stage => new
            {
                StageId = stage.Id,
                stage.StageNumber,
                stage.StartTime,
                stage.ResultsPublished,

                stage
                    .YellowJerseyCompetitionCyclistId,

                stage
                    .GreenJerseyCompetitionCyclistId,

                stage
                    .PolkaDotJerseyCompetitionCyclistId
            })
            .ToListAsync();

        if (stages.Count == 0)
        {
            return BadRequest(
                "De wedstrijd kan niet worden afgerond omdat er geen etappes zijn."
            );
        }

        var now = DateTime.UtcNow;

        var unpublishedStartedStage =
            stages
                .Where(stage =>
                    stage.StartTime.HasValue &&
                    GetUtcDateTime(
                        stage.StartTime.Value
                    ) <= now &&
                    !stage.ResultsPublished
                )
                .OrderBy(stage =>
                    stage.StageNumber
                )
                .FirstOrDefault();

        if (unpublishedStartedStage != null)
        {
            return BadRequest(
                $"Etappe {unpublishedStartedStage.StageNumber} is gestart, maar de uitslag is nog niet gepubliceerd."
            );
        }

        var publishedStages = stages
            .Where(stage =>
                stage.ResultsPublished
            )
            .ToList();

        if (publishedStages.Count == 0)
        {
            return BadRequest(
                "De wedstrijd kan niet worden afgerond omdat er nog geen etappe-uitslagen zijn gepubliceerd."
            );
        }

        var publishedStageIds =
            publishedStages
                .Select(stage =>
                    stage.StageId
                )
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
                        .CompetitionId == id
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

        var finalizedAt = DateTime.UtcNow;

        var orderedStandings = competitionUsers
            .Select(competitionUser => new
            {
                competitionUser.UserId,
                competitionUser.UserName,

                TotalPoints =
                    pointTotals.GetValueOrDefault(
                        competitionUser
                            .CompetitionUserId
                    )
            })
            .OrderByDescending(standing =>
                standing.TotalPoints
            )
            .ThenBy(standing =>
                standing.UserName
            )
            .ThenBy(standing =>
                standing.UserId
            )
            .ToList();

        var existingSnapshots =
            await _context
                .CompetitionFinalStandings
                .Where(finalStanding =>
                    finalStanding.CompetitionId == id
                )
                .ToListAsync();

        if (existingSnapshots.Count > 0)
        {
            return BadRequest(
                "Voor deze wedstrijd bestaat al een definitief eindklassement."
            );
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            for (
                var index = 0;
                index < orderedStandings.Count;
                index++
            )
            {
                var standing =
                    orderedStandings[index];

                _context.CompetitionFinalStandings.Add(
                    new CompetitionFinalStanding
                    {
                        Id = Guid.NewGuid(),
                        CompetitionId = id,
                        UserId = standing.UserId,
                        Position = index + 1,
                        TotalPoints =
                            standing.TotalPoints,
                        FinalizedAt =
                            finalizedAt
                    }
                );
            }

            competition.IsFinished = true;
            competition.FinishedAt = finalizedAt;
            competition.IsActive = false;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        var topThree = orderedStandings
            .Take(3)
            .Select((standing, index) => new
            {
                position = index + 1,
                standing.UserId,
                standing.UserName,
                standing.TotalPoints
            })
            .ToList();

        return Ok(new
        {
            message =
                "De wedstrijd is definitief afgerond.",
            competition.Id,
            competition.Name,
            competition.Year,
            competition.IsFinished,
            competition.FinishedAt,
            topThree
        });
    }

    // Alleen moderators mogen een competitie verwijderen.
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> DeleteCompetition(
        Guid id
    )
    {
        var competition =
            await _context.Competitions
                .Include(item =>
                    item.CompetitionCyclists
                )
                .Include(item =>
                    item.CompetitionUsers
                )
                .Include(item =>
                    item.FinalStandings
                )
                .FirstOrDefaultAsync(item =>
                    item.Id == id
                );

        if (competition == null)
        {
            return NotFound(
                "Wedstrijd niet gevonden."
            );
        }

        if (
            competition
                .CompetitionCyclists
                .Count > 0
        )
        {
            return BadRequest(
                "Deze wedstrijd kan niet worden verwijderd omdat er renners aan gekoppeld zijn."
            );
        }

        if (
            competition
                .CompetitionUsers
                .Count > 0
        )
        {
            return BadRequest(
                "Deze wedstrijd kan niet worden verwijderd omdat er deelnemers aan gekoppeld zijn."
            );
        }

        if (
            competition
                .FinalStandings
                .Count > 0
        )
        {
            return BadRequest(
                "Deze wedstrijd kan niet worden verwijderd omdat er een definitief eindklassement is opgeslagen."
            );
        }

        _context.Competitions.Remove(
            competition
        );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Wedstrijd verwijderd"
        });
    }

    private IActionResult? ValidateCompetition(
        Competition competition
    )
    {
        if (
            string.IsNullOrWhiteSpace(
                competition.Name
            )
        )
        {
            return BadRequest(
                "Naam is verplicht."
            );
        }

        if (
            competition.Year < 2000 ||
            competition.Year > 2200
        )
        {
            return BadRequest(
                "Vul een geldig jaar in."
            );
        }

        if (competition.TeamSize <= 0)
        {
            return BadRequest(
                "Ploeggrootte moet groter zijn dan 0."
            );
        }

        if (competition.Budget <= 0)
        {
            return BadRequest(
                "Budget moet groter zijn dan 0 miljoen."
            );
        }

        if (competition.MaxTransfers < 0)
        {
            return BadRequest(
                "Het maximale aantal wissels mag niet negatief zijn."
            );
        }

        if (
            competition.TeamLockDate ==
            default
        )
        {
            return BadRequest(
                "Vul een geldige deadline in."
            );
        }

        return null;
    }

    private static int CalculateSelectionPoints(
        Guid competitionCyclistId,
        Guid? jokerStageId,
        IEnumerable<Guid> publishedStageIds,
        IReadOnlyDictionary<
            (
                Guid CompetitionCyclistId,
                Guid StageId
            ),
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
