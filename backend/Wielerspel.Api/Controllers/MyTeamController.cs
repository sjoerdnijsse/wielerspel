using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Wielerspel.Api.Data;
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
            return Ok(new
            {
                competitionId,
                competitionName = competition.Name,
                competitionYear = competition.Year,
                teamSize = competition.TeamSize,
                budget = competition.Budget,
                maxTransfers = competition.MaxTransfers,
                transfersUsed = 0,
                teamLocked = false,
                selectedCount = 0,
                totalPrice = 0,
                remainingBudget = competition.Budget,
                cyclists = Array.Empty<object>()
            });
        }

        var selectedCyclists = await _context.CompetitionUserCyclists
            .Where(x => x.CompetitionUserId == competitionUser.Id)
            .Include(x => x.CompetitionCyclist)
                .ThenInclude(x => x.Cyclist)
                    .ThenInclude(x => x.Team)
            .OrderBy(x => x.CompetitionCyclist.Cyclist.Name)
            .Select(x => new
            {
                selectionId = x.Id,
                competitionCyclistId = x.CompetitionCyclistId,
                cyclistId = x.CompetitionCyclist.CyclistId,
                name = x.CompetitionCyclist.Cyclist.Name,
                number = x.CompetitionCyclist.Number,
                price = x.CompetitionCyclist.Price,
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

        return Ok(new
        {
            competitionId,
            competitionName = competition.Name,
            competitionYear = competition.Year,
            teamSize = competition.TeamSize,
            budget = competition.Budget,
            maxTransfers = competition.MaxTransfers,
            transfersUsed = competitionUser.TransfersUsed,
            teamLocked = competitionUser.TeamLocked,
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

        var competitionUser = await GetOrCreateCompetitionUser(
            competitionId,
            userId
        );

        var alreadySelected = await _context.CompetitionUserCyclists
            .AnyAsync(x =>
                x.CompetitionUserId == competitionUser.Id &&
                x.CompetitionCyclistId == competitionCyclistId
            );

        if (alreadySelected)
        {
            return BadRequest("Deze renner zit al in je ploeg.");
        }

        var currentTeam = await _context.CompetitionUserCyclists
            .Where(x => x.CompetitionUserId == competitionUser.Id)
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

        var newTotalPrice = currentPrice + competitionCyclist.Price;

        if (newTotalPrice > competition.Budget)
        {
            return BadRequest(
                $"Onvoldoende budget. Je budget is €{competition.Budget} miljoen."
            );
        }

        // Voorlopig blokkeren we losse toevoegingen na de deadline.
        // Later gebruiken we hiervoor een echte wisselactie.
        if (DateTime.UtcNow >= competition.TeamLockDate.ToUniversalTime())
        {
            return BadRequest(
                "De ploeg is definitief. Gebruik na de deadline een wissel."
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
            remainingBudget = competition.Budget - newTotalPrice
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

        if (DateTime.UtcNow >= competition.TeamLockDate.ToUniversalTime())
        {
            return BadRequest(
                "De ploeg is definitief. Gebruik na de deadline een wissel."
            );
        }

        var competitionUser = await _context.CompetitionUsers
            .FirstOrDefaultAsync(x =>
                x.CompetitionId == competitionId &&
                x.UserId == userId
            );

        if (competitionUser == null)
        {
            return NotFound("Je hebt nog geen ploeg voor deze wedstrijd.");
        }

        var selection = await _context.CompetitionUserCyclists
            .Include(x => x.CompetitionCyclist)
            .FirstOrDefaultAsync(x =>
                x.CompetitionUserId == competitionUser.Id &&
                x.CompetitionCyclistId == competitionCyclistId
            );

        if (selection == null)
        {
            return NotFound("Deze renner zit niet in je ploeg.");
        }

        _context.CompetitionUserCyclists.Remove(selection);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Renner verwijderd uit je ploeg"
        });
    }

    private async Task<CompetitionUser> GetOrCreateCompetitionUser(
        Guid competitionId,
        Guid userId
    )
    {
        var competitionUser = await _context.CompetitionUsers
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

        _context.CompetitionUsers.Add(competitionUser);
        await _context.SaveChangesAsync();

        return competitionUser;
    }

    private Guid GetUserId()
    {
        var value =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!Guid.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Geen geldige gebruiker gevonden in het token."
            );
        }

        return userId;
    }
}