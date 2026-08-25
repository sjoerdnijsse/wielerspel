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
                        name = x.CompetitionCyclist.Cyclist.Team.Name,
                        jerseyImageUrl =
                            x.CompetitionCyclist.Cyclist.Team.JerseyImageUrl
                    }
            })
            .ToListAsync();

        var totalPrice = selectedCyclists.Sum(x => x.price);

        var transfersRemaining = Math.Max(
            competition.MaxTransfers - competitionUser.TransfersUsed,
            0
        );

        var hasUnpublishedStartedStage =
            await HasUnpublishedStartedStage(
                competitionId
            );

        var transfersAllowed =
            IsTransferPeriodOpen(competition) &&
            transfersRemaining > 0 &&
            !hasUnpublishedStartedStage;

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
            transfersAllowed,
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

   // Na de deadline één of meer renners
    // in één keer vervangen.
    //
    // Iedere CompetitionUserCyclist blijft bestaan.
    // Daardoor blijft ook de joker aan dezelfde
    // selectieplek gekoppeld.
    [HttpPost("transfer")]
    public async Task<IActionResult> TransferCyclists(
        Guid competitionId,
        TransferCyclistsRequest request
    )
    {
        if (request.Transfers == null ||
            request.Transfers.Count == 0)
        {
            return BadRequest(
                "Selecteer minimaal één transfer."
            );
        }

        var userId = GetUserId();

        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x =>
                x.Id == competitionId
            );

        if (competition == null)
        {
            return NotFound(
                "Wedstrijd niet gevonden."
            );
        }

        if (!IsTransferPeriodOpen(competition))
        {
            return BadRequest(
                "Transfers zijn pas toegestaan nadat de ploegdeadline is verstreken."
            );
        }

        if (await HasUnpublishedStartedStage(
                competitionId
            ))
        {
            return BadRequest(
                "Transfers zijn niet toegestaan zolang een gestarte etappe nog niet is gepubliceerd."
            );
        }

        var lastCompletedStageNumber =
            await _context.Stages
                .AsNoTracking()
                .Where(stage =>
                    stage.CompetitionId == competitionId &&
                    stage.ResultsPublished
                )
                .Select(stage => (int?)stage.StageNumber)
                .MaxAsync() ?? 0;

        var newCyclistFromStageNumber =
            lastCompletedStageNumber + 1;

        var competitionUser =
            await _context.CompetitionUsers
                .FirstOrDefaultAsync(x =>
                    x.CompetitionId ==
                        competitionId &&
                    x.UserId == userId
                );

        if (competitionUser == null)
        {
            return NotFound(
                "Je hebt nog geen ploeg voor deze wedstrijd."
            );
        }

        // Een transferbatch begint altijd met
        // een volledige ploeg.
        var currentTeam =
            await _context.CompetitionUserCyclists
                .Where(x =>
                    x.CompetitionUserId ==
                    competitionUser.Id
                )
                .Include(x =>
                    x.CompetitionCyclist
                )
                    .ThenInclude(x =>
                        x.Cyclist
                    )
                .ToListAsync();

        if (currentTeam.Count != competition.TeamSize)
        {
            return BadRequest(
                $"Je ploeg moet uit precies {competition.TeamSize} renners bestaan voordat je transfers kunt uitvoeren."
            );
        }

        var transferCount =
            request.Transfers.Count;

        if (
            competitionUser.TransfersUsed +
            transferCount >
            competition.MaxTransfers
        )
        {
            var transfersRemaining = Math.Max(
                competition.MaxTransfers -
                competitionUser.TransfersUsed,
                0
            );

            return BadRequest(
                $"Je hebt nog {transfersRemaining} transfer(s) beschikbaar."
            );
        }

        // Iedere selectieplek mag binnen één batch
        // maar één keer worden vervangen.
        var duplicateSelectionIds =
            request.Transfers
                .GroupBy(x =>
                    x.CompetitionUserCyclistId
                )
                .Any(group =>
                    group.Count() > 1
                );

        if (duplicateSelectionIds)
        {
            return BadRequest(
                "Dezelfde plek in je ploeg kan niet meerdere keren in één transfer worden gebruikt."
            );
        }

        // Dezelfde nieuwe renner mag niet op
        // meerdere plekken terechtkomen.
        var duplicateIncomingCyclistIds =
            request.Transfers
                .GroupBy(x =>
                    x.IncomingCompetitionCyclistId
                )
                .Any(group =>
                    group.Count() > 1
                );

        if (duplicateIncomingCyclistIds)
        {
            return BadRequest(
                "Dezelfde nieuwe renner kan niet meerdere keren worden geselecteerd."
            );
        }

        var currentTeamBySelectionId =
            currentTeam.ToDictionary(
                selection => selection.Id
            );

        // Controleer of alle gekozen plekken
        // daadwerkelijk van deze speler zijn.
        foreach (var transfer in request.Transfers)
        {
            if (!currentTeamBySelectionId.ContainsKey(
                    transfer.CompetitionUserCyclistId
                ))
            {
                return BadRequest(
                    "Een of meer gekozen selectieplekken horen niet bij jouw ploeg."
                );
            }
        }

        var incomingCyclistIds =
            request.Transfers
                .Select(x =>
                    x.IncomingCompetitionCyclistId
                )
                .ToList();

        var incomingCyclists =
            await _context.CompetitionCyclists
                .Where(x =>
                    x.CompetitionId ==
                        competitionId &&
                    incomingCyclistIds.Contains(
                        x.Id
                    )
                )
                .Include(x => x.Cyclist)
                .ToListAsync();

        if (
            incomingCyclists.Count !=
            incomingCyclistIds.Count
        )
        {
            return BadRequest(
                "Een of meer nieuwe renners horen niet bij deze wedstrijd."
            );
        }

        var incomingCyclistById =
            incomingCyclists.ToDictionary(
                cyclist => cyclist.Id
            );

        var currentCompetitionCyclistIds =
            currentTeam
                .Select(x =>
                    x.CompetitionCyclistId
                )
                .ToHashSet();

        // Een renner die al in de huidige ploeg zit,
        // mag niet opnieuw als nieuwe renner worden
        // geselecteerd.
        foreach (var incomingCyclistId in
                incomingCyclistIds)
        {
            if (
                currentCompetitionCyclistIds.Contains(
                    incomingCyclistId
                )
            )
            {
                return BadRequest(
                    "Een van de gekozen nieuwe renners zit al in je ploeg."
                );
            }
        }

        // Bouw eerst in het geheugen de volledige
        // nieuwe ploeg op.
        var finalCyclistIds =
            currentTeam
                .Select(x =>
                    x.CompetitionCyclistId
                )
                .ToList();

        foreach (var transfer in request.Transfers)
        {
            var selection =
                currentTeamBySelectionId[
                    transfer
                        .CompetitionUserCyclistId
                ];

            var index =
                currentTeam.FindIndex(x =>
                    x.Id == selection.Id
                );

            finalCyclistIds[index] =
                transfer
                    .IncomingCompetitionCyclistId;
        }

        // Extra veiligheid: na de transfer moeten
        // exact evenveel unieke renners overblijven
        // als de voorgeschreven ploegomvang.
        if (
            finalCyclistIds.Count !=
                competition.TeamSize ||
            finalCyclistIds.Distinct().Count() !=
                competition.TeamSize
        )
        {
            return BadRequest(
                $"Na de transfers moet je ploeg uit precies {competition.TeamSize} verschillende renners bestaan."
            );
        }

        // Bereken de prijs van de HELE nieuwe ploeg.
        // Hierdoor mogen twee goedkope verkochte
        // renners samen bijvoorbeeld één dure en
        // één goedkope nieuwe renner financieren.
        var finalCyclistPrices =
            await _context.CompetitionCyclists
                .AsNoTracking()
                .Where(x =>
                    finalCyclistIds.Contains(x.Id)
                )
                .Select(x => new
                {
                    x.Id,
                    x.Price
                })
                .ToListAsync();

        if (
            finalCyclistPrices.Count !=
            competition.TeamSize
        )
        {
            return BadRequest(
                "De nieuwe ploeg kon niet volledig worden samengesteld."
            );
        }

        var newTotalPrice =
            finalCyclistPrices.Sum(x =>
                x.Price
            );

        if (
            newTotalPrice >
            competition.Budget
        )
        {
            var amountOverBudget =
                newTotalPrice -
                competition.Budget;

            return BadRequest(
                $"Deze transfers overschrijden je budget met €{amountOverBudget} miljoen."
            );
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            foreach (var transfer in request.Transfers)
            {
                var selection =
                    currentTeamBySelectionId[
                        transfer.CompetitionUserCyclistId
                    ];

                var oldCompetitionCyclistId =
                    selection.CompetitionCyclistId;

                // Kijk of voor deze selectieplek al een
                // actieve historische periode bestaat.
                var currentHistory =
                    await _context
                        .CompetitionUserCyclistHistories
                        .FirstOrDefaultAsync(history =>
                            history.CompetitionUserCyclistId ==
                                selection.Id &&
                            history.ToStageNumber == null
                        );

                if (currentHistory == null)
                {
                    // Eerste transfer op deze plek.
                    //
                    // De oorspronkelijke renner zat vanaf
                    // etappe 1 op deze plek.
                    _context
                        .CompetitionUserCyclistHistories
                        .Add(
                            new CompetitionUserCyclistHistory
                            {
                                Id = Guid.NewGuid(),
                                CompetitionUserCyclistId =
                                    selection.Id,
                                CompetitionCyclistId =
                                    oldCompetitionCyclistId,
                                FromStageNumber = 1,
                                ToStageNumber =
                                    newCyclistFromStageNumber - 1
                            }
                        );
                }
                else
                {
                    // Deze plek is al eerder getransfereerd.
                    // Sluit de huidige periode af.
                    currentHistory.ToStageNumber =
                        newCyclistFromStageNumber - 1;
                }

                // Maak een nieuwe actieve periode voor
                // de inkomende renner.
                _context
                    .CompetitionUserCyclistHistories
                    .Add(
                        new CompetitionUserCyclistHistory
                        {
                            Id = Guid.NewGuid(),
                            CompetitionUserCyclistId =
                                selection.Id,
                            CompetitionCyclistId =
                                transfer
                                    .IncomingCompetitionCyclistId,
                            FromStageNumber =
                                newCyclistFromStageNumber,
                            ToStageNumber = null
                        }
                    );

                // CompetitionUserCyclist blijft de actuele
                // ploeg vertegenwoordigen.
                //
                // selection.Id blijft gelijk en daardoor
                // blijft ook JokerStageId op dezelfde plek.
                selection.CompetitionCyclistId =
                    transfer.IncomingCompetitionCyclistId;
            }

            competitionUser.TransfersUsed +=
                transferCount;

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
                transferCount == 1
                    ? "De transfer is uitgevoerd."
                    : $"{transferCount} transfers zijn uitgevoerd.",

            transfersUsed =
                competitionUser.TransfersUsed,

            transfersRemaining = Math.Max(
                competition.MaxTransfers -
                competitionUser.TransfersUsed,
                0
            ),

            totalPrice =
                newTotalPrice,

            remainingBudget =
                competition.Budget -
                newTotalPrice
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

public sealed class TransferCyclistsRequest
{
    public List<TransferCyclistItemRequest> Transfers
    {
        get;
        set;
    } = new();
}

public sealed class TransferCyclistItemRequest
{
    // De vaste plek in de spelersploeg.
    // Hieraan blijft de joker gekoppeld.
    public Guid CompetitionUserCyclistId
    {
        get;
        set;
    }

    // De nieuwe renner die op deze plek komt.
    public Guid IncomingCompetitionCyclistId
    {
        get;
        set;
    }
}