using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.DTOs;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/competitions/{competitionId:guid}/cyclists")]
[Authorize]
public class CompetitionCyclistsController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public CompetitionCyclistsController(
        WielerspelDbContext context
    )
    {
        _context = context;
    }

    // Iedere ingelogde gebruiker mag de renners en prijzen
    // van een actieve competitie bekijken.
    [HttpGet]
    public async Task<IActionResult> GetCompetitionCyclists(
        Guid competitionId
    )
    {
        var competition = await _context.Competitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        if (!competition.IsActive &&
            !User.IsInRole("Moderator"))
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var cyclists = await _context.CompetitionCyclists
            .AsNoTracking()
            .Where(x => x.CompetitionId == competitionId)
            .Include(x => x.Cyclist)
                .ThenInclude(x => x.Team)
            .OrderBy(x => x.Cyclist.Team == null
                ? string.Empty
                : x.Cyclist.Team.Name)
            .ThenBy(x => x.Cyclist.Name)
            .Select(x => new
            {
                x.Id,
                x.CompetitionId,
                x.CyclistId,
                x.Price,

                Cyclist = new
                {
                    x.Cyclist.Id,
                    x.Cyclist.Name,
                    x.Cyclist.TeamId,

                    Team = x.Cyclist.Team == null
                        ? null
                        : new
                        {
                            x.Cyclist.Team.Id,
                            x.Cyclist.Team.Name
                        }
                }
            })
            .ToListAsync();

        return Ok(cyclists);
    }

    // Alleen moderators mogen een renner aan een competitie
    // koppelen.
    [HttpPost]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> AddCompetitionCyclist(
        Guid competitionId,
        CompetitionCyclistRequest request
    )
    {
        var competitionExists = await _context.Competitions
            .AnyAsync(x => x.Id == competitionId);

        if (!competitionExists)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var cyclistExists = await _context.Cyclists
            .AnyAsync(x => x.Id == request.CyclistId);

        if (!cyclistExists)
        {
            return NotFound("Renner niet gevonden.");
        }

        if (request.Price <= 0)
        {
            return BadRequest(
                "De prijs moet groter zijn dan 0 miljoen."
            );
        }

        var alreadyAdded = await _context.CompetitionCyclists
            .AnyAsync(x =>
                x.CompetitionId == competitionId &&
                x.CyclistId == request.CyclistId
            );

        if (alreadyAdded)
        {
            return BadRequest(
                "Deze renner is al aan deze wedstrijd gekoppeld."
            );
        }

        var competitionCyclist = new CompetitionCyclist
        {
            Id = Guid.NewGuid(),
            CompetitionId = competitionId,
            CyclistId = request.CyclistId,
            Price = request.Price
        };

        _context.CompetitionCyclists.Add(
            competitionCyclist
        );

        await _context.SaveChangesAsync();

        var createdItem = await _context.CompetitionCyclists
            .AsNoTracking()
            .Where(x => x.Id == competitionCyclist.Id)
            .Include(x => x.Cyclist)
                .ThenInclude(x => x.Team)
            .Select(x => new
            {
                x.Id,
                x.CompetitionId,
                x.CyclistId,
                x.Price,

                Cyclist = new
                {
                    x.Cyclist.Id,
                    x.Cyclist.Name,
                    x.Cyclist.TeamId,

                    Team = x.Cyclist.Team == null
                        ? null
                        : new
                        {
                            x.Cyclist.Team.Id,
                            x.Cyclist.Team.Name
                        }
                }
            })
            .FirstAsync();

        return Ok(createdItem);
    }

    // Alleen moderators mogen de prijs van een
    // wedstrijdrenner wijzigen.
    [HttpPut("{cyclistId:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UpdateCompetitionCyclist(
        Guid competitionId,
        Guid cyclistId,
        CompetitionCyclistRequest request
    )
    {
        if (request.Price <= 0)
        {
            return BadRequest(
                "De prijs moet groter zijn dan 0 miljoen."
            );
        }

        var competitionCyclist =
            await _context.CompetitionCyclists
                .FirstOrDefaultAsync(x =>
                    x.CompetitionId == competitionId &&
                    x.CyclistId == cyclistId
                );

        if (competitionCyclist == null)
        {
            return NotFound(
                "Deze renner is niet aan deze wedstrijd gekoppeld."
            );
        }

        competitionCyclist.Price = request.Price;

        await _context.SaveChangesAsync();

        var updatedItem = await _context.CompetitionCyclists
            .AsNoTracking()
            .Where(x =>
                x.CompetitionId == competitionId &&
                x.CyclistId == cyclistId
            )
            .Include(x => x.Cyclist)
                .ThenInclude(x => x.Team)
            .Select(x => new
            {
                x.Id,
                x.CompetitionId,
                x.CyclistId,
                x.Price,

                Cyclist = new
                {
                    x.Cyclist.Id,
                    x.Cyclist.Name,
                    x.Cyclist.TeamId,

                    Team = x.Cyclist.Team == null
                        ? null
                        : new
                        {
                            x.Cyclist.Team.Id,
                            x.Cyclist.Team.Name
                        }
                }
            })
            .FirstAsync();

        return Ok(updatedItem);
    }

    // Alleen moderators mogen een renner uit een
    // competitie verwijderen.
    //
    // Als spelers deze renner al in hun ploeg hebben,
    // wordt de renner ook automatisch uit die
    // spelersploegen verwijderd.
    [HttpDelete("{cyclistId:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> RemoveCompetitionCyclist(
        Guid competitionId,
        Guid cyclistId
    )
    {
        var competitionCyclist =
            await _context.CompetitionCyclists
                .Include(x => x.Cyclist)
                .FirstOrDefaultAsync(x =>
                    x.CompetitionId == competitionId &&
                    x.CyclistId == cyclistId
                );

        if (competitionCyclist == null)
        {
            return NotFound(
                "Deze renner is niet aan deze wedstrijd gekoppeld."
            );
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            // Zoek alle spelers die deze renner
            // in hun ploeg hebben geselecteerd.
            var playerSelections =
                await _context.CompetitionUserCyclists
                    .Where(x =>
                        x.CompetitionCyclistId ==
                        competitionCyclist.Id
                    )
                    .ToListAsync();

            var affectedPlayerCount =
                playerSelections.Count;

            // Verwijder de renner eerst uit alle
            // spelersploegen.
            if (playerSelections.Count > 0)
            {
                _context.CompetitionUserCyclists
                    .RemoveRange(playerSelections);
            }

            // Daarna kan de wedstrijdrenner zelf
            // worden verwijderd.
            _context.CompetitionCyclists.Remove(
                competitionCyclist
            );

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message =
                    affectedPlayerCount > 0
                        ? $"{competitionCyclist.Cyclist.Name} is uit de wedstrijd verwijderd en uit {affectedPlayerCount} spelersploeg(en) gehaald."
                        : $"{competitionCyclist.Cyclist.Name} is uit de wedstrijd verwijderd.",
                affectedPlayerCount
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}