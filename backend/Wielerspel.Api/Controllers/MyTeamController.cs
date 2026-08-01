using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Wielerspel.Api.Data;
using Wielerspel.Api.DTOs.MyTeam;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/competitions/{competitionId:guid}/myteam")]
[Authorize]
public class MyTeamController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public MyTeamController(WielerspelDbContext context)
    {
        _context = context;
    }

    // Ploeg van de ingelogde gebruiker ophalen
    [HttpGet]
    public async Task<IActionResult> GetMyTeam(Guid competitionId)
    {
        var userId = GetUserId();

        var competition = await _context.Competitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var competitionUser = await _context.CompetitionUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.CompetitionId == competitionId &&
                x.UserId == userId
            );

        if (competitionUser == null)
        {
            return Ok(new
            {
                competitionId,
                competitionName = competition.Name,
                competitionYear = competition.Year,
                teamSize = competition.TeamSize,
                budget = competition.Budget,
                maxTransfers = competition.MaxTransfers,
                transfersUsed = 0,
                transfersRemaining = competition.MaxTransfers,
                teamLocked = IsTeamLocked(
                    competition,
                    competitionUser: null
                ),
                transfersAllowed = IsTransferPeriodOpen(competition),
                teamLockDate = competition.TeamLockDate,
                selectedCount = 0,
                totalPrice = 0,
                remainingBudget = competition.Budget,
                cyclists = Array.Empty<object>()
            });
        }

        var selectedCyclists = await _context.CompetitionUserCyclists
            .AsNoTracking()
            .Where(x => x.CompetitionUserId == competitionUser.Id)
            .Include(x => x.CompetitionCyclist)
                .ThenInclude(x => x.Cyclist)
                    .ThenInclude(x => x.Team)
            .Include(x => x.JokerStage)
            .OrderBy(x => x.CompetitionCyclist.Cyclist.Name)
            .Select(x => new
            {
                selectionId = x.Id,
                competitionCyclistId = x.CompetitionCyclistId,
                cyclistId = x.CompetitionCyclist.CyclistId,
                name = x.CompetitionCyclist.Cyclist.Name,
                price = x.CompetitionCyclist.Price,
                jokerStageId = x.JokerStageId,
                jokerStageNumber = x.JokerStage == null
                    ? (int?)null
                    : x.JokerStage.StageNumber,
                team = x.CompetitionCyclist.Cyclist.Team == null
                    ? null
                    : new
                    {
                        id = x.CompetitionCyclist.Cyclist.Team.Id,
                        name = x.CompetitionCyclist.Cyclist.Team.Name
                    }
            })
            .ToListAsync();

        var totalPrice = selectedCyclists.Sum(x => x.price);

        var transfersRemaining = Math.Max(
            competition.MaxTransfers - competitionUser.TransfersUsed,
            0
        );

        return Ok(new
        {
            competitionId,
            competitionName = competition.Name,
            competitionYear = competition.Year,
            teamSize = competition.TeamSize,
            budget = competition.Budget,
            maxTransfers = competition.MaxTransfers,
            transfersUsed = competitionUser.TransfersUsed,
            transfersRemaining,
            teamLocked = IsTeamLocked(
                competition,
                competitionUser
            ),
            transfersAllowed =
                IsTransferPeriodOpen(competition) &&
                transfersRemaining > 0,
            teamLockDate = competition.TeamLockDate,
            selectedCount = selectedCyclists.Count,
            totalPrice,
            remainingBudget = competition.Budget - totalPrice,
            cyclists = selectedCyclists
        });
    }

    // Renner aan de gebruikersploeg toevoegen
    [HttpPost("{competitionCyclistId:guid}")]
    public async Task<IActionResult> AddCyclist(
        Guid competitionId,
        Guid competitionCyclistId
    )
    {
        var userId = GetUserId();

        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var existingCompetitionUser = await _context.CompetitionUsers
            .FirstOrDefaultAsync(x =>
                x.CompetitionId == competitionId &&
                x.UserId == userId
            );

        if (IsTeamLocked(
            competition,
            existingCompetitionUser
        ))
        {
            return BadRequest(
                "De deadline voor het aanpassen van je ploeg is verstreken."
            );
        }

        var competitionCyclist = await _context.CompetitionCyclists
            .Include(x => x.Cyclist)
            .FirstOrDefaultAsync(x =>
                x.Id == competitionCyclistId &&
                x.CompetitionId == competitionId
            );

        if (competitionCyclist == null)
        {
            return NotFound(
                "Deze renner is niet aan deze wedstrijd gekoppeld."
            );
        }

        var competitionUser =
            existingCompetitionUser ??
            await GetOrCreateCompetitionUser(
                competitionId,
                userId
            );

        var alreadySelected =
            await _context.CompetitionUserCyclists
                .AnyAsync(x =>
                    x.CompetitionUserId == competitionUser.Id &&
                    x.CompetitionCyclistId == competitionCyclistId
                );

        if (alreadySelected)
        {
            return BadRequest(
                "Deze renner zit al in je ploeg."
            );
        }

        var currentTeam = await _context.CompetitionUserCyclists
            .Where(x =>
                x.CompetitionUserId == competitionUser.Id
            )
            .Include(x => x.CompetitionCyclist)
            .ToListAsync();

        if (currentTeam.Count >= competition.TeamSize)
        {
            return BadRequest(
                $"Je ploeg mag maximaal {competition.TeamSize} renners bevatten."
            );
        }

        var currentPrice = currentTeam
            .Sum(x => x.CompetitionCyclist.Price);

        var newTotalPrice =
            currentPrice + competitionCyclist.Price;

        if (newTotalPrice > competition.Budget)
        {
            return BadRequest(
                $"Onvoldoende budget. Je budget is €{competition.Budget} miljoen."
            );
        }

        var selection = new CompetitionUserCyclist
        {
            Id = Guid.NewGuid(),
            CompetitionUserId = competitionUser.Id,
            CompetitionCyclistId = competitionCyclistId
        };

        _context.CompetitionUserCyclists.Add(selection);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Renner toegevoegd aan je ploeg",
            selectedCount = currentTeam.Count + 1,
            totalPrice = newTotalPrice,
            remainingBudget =
                competition.Budget - newTotalPrice
        });
    }

    // Renner uit de gebruikersploeg verwijderen
    [HttpDelete("{competitionCyclistId:guid}")]
    public async Task<IActionResult> RemoveCyclist(
        Guid competitionId,
        Guid competitionCyclistId
    )
    {
        var userId = GetUserId();

        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var competitionUser = await _context.CompetitionUsers
            .FirstOrDefaultAsync(x =>
                x.CompetitionId == competitionId &&
                x.UserId == userId
            );

        if (competitionUser == null)
        {
            return NotFound(
                "Je hebt nog geen ploeg voor deze wedstrijd."
            );
        }

        if (IsTeamLocked(
            competition,
            competitionUser
        ))
        {
            return BadRequest(
                "De deadline voor het aanpassen van je ploeg is verstreken."
            );
        }

        var selection = await _context.CompetitionUserCyclists
            .FirstOrDefaultAsync(x =>
                x.CompetitionUserId == competitionUser.Id &&
                x.CompetitionCyclistId == competitionCyclistId
            );

        if (selection == null)
        {
            return NotFound(
                "Deze renner zit niet in je ploeg."
            );
        }

        _context.CompetitionUserCyclists.Remove(selection);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Renner verwijderd uit je ploeg"
        });
    }

    // Alle jokers van de ingelogde speler in één keer opslaan
    [HttpPut("jokers")]
    public async Task<IActionResult> SaveJokers(
        Guid competitionId,
        SaveJokersRequest request
    )
    {
        var userId = GetUserId();

        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var competitionUser = await _context.CompetitionUsers
            .FirstOrDefaultAsync(x =>
                x.CompetitionId == competitionId &&
                x.UserId == userId
            );

        if (competitionUser == null)
        {
            return NotFound(
                "Je hebt nog geen ploeg voor deze wedstrijd."
            );
        }

        if (IsTeamLocked(
            competition,
            competitionUser
        ))
        {
            return BadRequest(
                "Jokers kunnen alleen vóór de ploegdeadline worden ingesteld."
            );
        }

        var teamSelections = await _context.CompetitionUserCyclists
            .Where(x =>
                x.CompetitionUserId == competitionUser.Id
            )
            .ToListAsync();

        if (teamSelections.Count != competition.TeamSize)
        {
            return BadRequest(
                $"Je ploeg moet compleet zijn voordat je jokers kunt instellen. " +
                $"Je hebt {teamSelections.Count} van de {competition.TeamSize} renners geselecteerd."
            );
        }

        if (request.Jokers == null)
        {
            return BadRequest(
                "Geen jokergegevens ontvangen."
            );
        }

        if (request.Jokers.Count != teamSelections.Count)
        {
            return BadRequest(
                $"Selecteer voor alle {teamSelections.Count} renners één jokeretappe."
            );
        }

        var duplicateSelectionIds = request.Jokers
            .GroupBy(joker =>
                joker.CompetitionUserCyclistId
            )
            .Any(group => group.Count() > 1);

        if (duplicateSelectionIds)
        {
            return BadRequest(
                "Een rennerselectie komt meerdere keren voor in de jokerkeuzes."
            );
        }

        var duplicateStageIds = request.Jokers
            .GroupBy(joker => joker.StageId)
            .Any(group => group.Count() > 1);

        if (duplicateStageIds)
        {
            return BadRequest(
                "Iedere etappe mag binnen je ploeg maar één keer als joker worden gebruikt."
            );
        }

        var teamSelectionIds = teamSelections
            .Select(selection => selection.Id)
            .ToHashSet();

        var submittedSelectionIds = request.Jokers
            .Select(joker =>
                joker.CompetitionUserCyclistId
            )
            .ToHashSet();

        if (!teamSelectionIds.SetEquals(
            submittedSelectionIds
        ))
        {
            return BadRequest(
                "Een of meer jokerkeuzes horen niet bij jouw huidige ploeg."
            );
        }

        var submittedStageIds = request.Jokers
            .Select(joker => joker.StageId)
            .ToList();

        var validStageIds = await _context.Stages
            .AsNoTracking()
            .Where(stage =>
                stage.CompetitionId == competitionId &&
                submittedStageIds.Contains(stage.Id)
            )
            .Select(stage => stage.Id)
            .ToListAsync();

        if (validStageIds.Count != submittedStageIds.Count)
        {
            return BadRequest(
                "Een of meer gekozen jokeretappes horen niet bij deze wedstrijd."
            );
        }

        var jokerStageBySelectionId = request.Jokers
            .ToDictionary(
                joker =>
                    joker.CompetitionUserCyclistId,
                joker => joker.StageId
            );

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            foreach (var selection in teamSelections)
            {
                selection.JokerStageId = null;
            }

            await _context.SaveChangesAsync();

            foreach (var selection in teamSelections)
            {
                selection.JokerStageId =
                    jokerStageBySelectionId[selection.Id];
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        var savedJokers = await _context.CompetitionUserCyclists
            .AsNoTracking()
            .Where(x =>
                x.CompetitionUserId == competitionUser.Id
            )
            .Include(x => x.JokerStage)
            .OrderBy(x =>
                x.CompetitionCyclist.Cyclist.Name
            )
            .Select(x => new
            {
                competitionUserCyclistId = x.Id,
                competitionCyclistId =
                    x.CompetitionCyclistId,
                cyclistName =
                    x.CompetitionCyclist.Cyclist.Name,
                jokerStageId = x.JokerStageId,
                jokerStageNumber = x.JokerStage == null
                    ? (int?)null
                    : x.JokerStage.StageNumber
            })
            .ToListAsync();

        return Ok(new
        {
            message = "De jokers zijn opgeslagen.",
            jokers = savedJokers
        });
    }

    // Na de deadline één renner vervangen door een andere renner
    [HttpPost("transfer")]
    public async Task<IActionResult> TransferCyclist(
        Guid competitionId,
        TransferCyclistRequest request
    )
    {
        if (
            request.OutgoingCompetitionCyclistId ==
            request.IncomingCompetitionCyclistId
        )
        {
            return BadRequest(
                "De nieuwe renner moet verschillen van de renner die je vervangt."
            );
        }

        var userId = GetUserId();

        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        if (!IsTransferPeriodOpen(competition))
        {
            return BadRequest(
                "Transfers zijn pas toegestaan nadat de ploegdeadline is verstreken."
            );
        }

        if (await HasUnpublishedStartedStage(competitionId))
        {
            return BadRequest(
                "Transfers zijn niet toegestaan zolang een gestarte etappe nog niet is gepubliceerd."
            );
        }

        var competitionUser = await _context.CompetitionUsers
            .FirstOrDefaultAsync(x =>
                x.CompetitionId == competitionId &&
                x.UserId == userId
            );

        if (competitionUser == null)
        {
            return NotFound(
                "Je hebt nog geen ploeg voor deze wedstrijd."
            );
        }

        if (competitionUser.TransfersUsed >= competition.MaxTransfers)
        {
            return BadRequest(
                $"Je hebt het maximum van {competition.MaxTransfers} transfers bereikt."
            );
        }

        var currentTeam = await _context.CompetitionUserCyclists
            .Where(x =>
                x.CompetitionUserId == competitionUser.Id
            )
            .Include(x => x.CompetitionCyclist)
                .ThenInclude(x => x.Cyclist)
            .ToListAsync();

        var outgoingSelection = currentTeam
            .FirstOrDefault(x =>
                x.CompetitionCyclistId ==
                request.OutgoingCompetitionCyclistId
            );

        if (outgoingSelection == null)
        {
            return NotFound(
                "De renner die je wilt vervangen zit niet in je ploeg."
            );
        }

        var incomingCyclist = await _context.CompetitionCyclists
            .Include(x => x.Cyclist)
            .FirstOrDefaultAsync(x =>
                x.Id ==
                    request.IncomingCompetitionCyclistId &&
                x.CompetitionId == competitionId
            );

        if (incomingCyclist == null)
        {
            return NotFound(
                "De nieuwe renner is niet aan deze wedstrijd gekoppeld."
            );
        }

        var incomingAlreadySelected = currentTeam.Any(x =>
            x.CompetitionCyclistId ==
            request.IncomingCompetitionCyclistId
        );

        if (incomingAlreadySelected)
        {
            return BadRequest(
                "De nieuwe renner zit al in je ploeg."
            );
        }

        var currentTotalPrice = currentTeam.Sum(x =>
            x.CompetitionCyclist.Price
        );

        var newTotalPrice =
            currentTotalPrice -
            outgoingSelection.CompetitionCyclist.Price +
            incomingCyclist.Price;

        if (newTotalPrice > competition.Budget)
        {
            var amountOverBudget =
                newTotalPrice - competition.Budget;

            return BadRequest(
                $"Deze transfer overschrijdt je budget met €{amountOverBudget} miljoen."
            );
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            outgoingSelection.CompetitionCyclistId =
                incomingCyclist.Id;

            competitionUser.TransfersUsed++;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return Ok(new
        {
            message =
                $"{outgoingSelection.CompetitionCyclist.Cyclist.Name} is vervangen door {incomingCyclist.Cyclist.Name}.",
            outgoingCompetitionCyclistId =
                request.OutgoingCompetitionCyclistId,
            incomingCompetitionCyclistId =
                request.IncomingCompetitionCyclistId,
            transfersUsed = competitionUser.TransfersUsed,
            transfersRemaining = Math.Max(
                competition.MaxTransfers -
                competitionUser.TransfersUsed,
                0
            ),
            totalPrice = newTotalPrice,
            remainingBudget =
                competition.Budget - newTotalPrice
        });
    }

    private static bool IsTeamLocked(
        Competition competition,
        CompetitionUser? competitionUser
    )
    {
        if (competitionUser?.TeamLocked == true)
        {
            return true;
        }

        return IsTransferPeriodOpen(competition);
    }

    private static bool IsTransferPeriodOpen(
        Competition competition
    )
    {
        return DateTime.UtcNow >= GetTeamLockDateUtc(competition);
    }

    private async Task<bool> HasUnpublishedStartedStage(
        Guid competitionId
    )
    {
        return await _context.Stages.AnyAsync(stage =>
            stage.CompetitionId == competitionId &&
            stage.StartTime.HasValue &&
            stage.StartTime.Value <= DateTime.UtcNow &&
            !stage.ResultsPublished
        );
    }

    private static DateTime GetTeamLockDateUtc(
        Competition competition
    )
    {
        return competition.TeamLockDate.Kind switch
        {
            DateTimeKind.Utc =>
                competition.TeamLockDate,

            DateTimeKind.Local =>
                competition.TeamLockDate.ToUniversalTime(),

            _ =>
                DateTime.SpecifyKind(
                    competition.TeamLockDate,
                    DateTimeKind.Utc
                )
        };
    }

    private async Task<CompetitionUser>
        GetOrCreateCompetitionUser(
            Guid competitionId,
            Guid userId
        )
    {
        var competitionUser =
            await _context.CompetitionUsers
                .FirstOrDefaultAsync(x =>
                    x.CompetitionId == competitionId &&
                    x.UserId == userId
                );

        if (competitionUser != null)
        {
            return competitionUser;
        }

        competitionUser = new CompetitionUser
        {
            Id = Guid.NewGuid(),
            CompetitionId = competitionId,
            UserId = userId,
            TransfersUsed = 0,
            TeamLocked = false
        };

        _context.CompetitionUsers.Add(
            competitionUser
        );

        await _context.SaveChangesAsync();

        return competitionUser;
    }

    private Guid GetUserId()
    {
        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            ) ??
            User.FindFirstValue(
                JwtRegisteredClaimNames.Sub
            );

        if (!Guid.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Geen geldige gebruiker gevonden in het token."
            );
        }

        return userId;
    }
}

public sealed class TransferCyclistRequest
{
    public Guid OutgoingCompetitionCyclistId { get; set; }

    public Guid IncomingCompetitionCyclistId { get; set; }
}