using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/cyclists")]
[Authorize]
public class CyclistsController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public CyclistsController(WielerspelDbContext context)
    {
        _context = context;
    }

    // Iedere ingelogde gebruiker mag renners bekijken
    [HttpGet]
    public async Task<IActionResult> GetCyclists()
    {
        var cyclists = await _context.Cyclists
            .Include(cyclist => cyclist.Team)
            .OrderBy(cyclist => cyclist.Name)
            .ToListAsync();

        return Ok(cyclists);
    }

    // Alleen moderators mogen renners toevoegen
    [HttpPost]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> CreateCyclist(Cyclist cyclist)
    {
        var name = cyclist.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Naam van de renner is verplicht.");
        }

        if (cyclist.Number <= 0)
        {
            return BadRequest("Rugnummer moet groter zijn dan 0.");
        }

        if (cyclist.Price <= 0)
        {
            return BadRequest("Prijs moet groter zijn dan 0 miljoen.");
        }

        var teamExists = await _context.Teams
            .AnyAsync(team => team.Id == cyclist.TeamId);

        if (!teamExists)
        {
            return BadRequest("De geselecteerde ploeg bestaat niet.");
        }

        var alreadyExists = await _context.Cyclists
            .AnyAsync(existingCyclist =>
                existingCyclist.Name.ToLower() == name.ToLower());

        if (alreadyExists)
        {
            return BadRequest("Deze renner bestaat al.");
        }

        var newCyclist = new Cyclist
        {
            Id = Guid.NewGuid(),
            Name = name,
            Number = cyclist.Number,
            Price = cyclist.Price,
            TeamId = cyclist.TeamId
        };

        _context.Cyclists.Add(newCyclist);
        await _context.SaveChangesAsync();

        var createdCyclist = await _context.Cyclists
            .Include(item => item.Team)
            .FirstAsync(item => item.Id == newCyclist.Id);

        return Ok(createdCyclist);
    }

    // Alleen moderators mogen renners wijzigen
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UpdateCyclist(Guid id, Cyclist cyclist)
    {
        var existingCyclist = await _context.Cyclists
            .FirstOrDefaultAsync(item => item.Id == id);

        if (existingCyclist == null)
        {
            return NotFound("Renner niet gevonden.");
        }

        var name = cyclist.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Naam van de renner is verplicht.");
        }

        if (cyclist.Number <= 0)
        {
            return BadRequest("Rugnummer moet groter zijn dan 0.");
        }

        if (cyclist.Price <= 0)
        {
            return BadRequest("Prijs moet groter zijn dan 0 miljoen.");
        }

        var teamExists = await _context.Teams
            .AnyAsync(team => team.Id == cyclist.TeamId);

        if (!teamExists)
        {
            return BadRequest("De geselecteerde ploeg bestaat niet.");
        }

        var duplicateExists = await _context.Cyclists
            .AnyAsync(otherCyclist =>
                otherCyclist.Id != id &&
                otherCyclist.Name.ToLower() == name.ToLower());

        if (duplicateExists)
        {
            return BadRequest("Er bestaat al een renner met deze naam.");
        }

        existingCyclist.Name = name;
        existingCyclist.Number = cyclist.Number;
        existingCyclist.Price = cyclist.Price;
        existingCyclist.TeamId = cyclist.TeamId;

        await _context.SaveChangesAsync();

        var updatedCyclist = await _context.Cyclists
            .Include(item => item.Team)
            .FirstAsync(item => item.Id == existingCyclist.Id);

        return Ok(updatedCyclist);
    }

    // Alleen moderators mogen renners verwijderen
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> DeleteCyclist(Guid id)
    {
        var cyclist = await _context.Cyclists
            .Include(item => item.UserCyclists)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (cyclist == null)
        {
            return NotFound("Renner niet gevonden.");
        }

        if (cyclist.UserCyclists.Count > 0)
        {
            return BadRequest(
                "Deze renner kan niet worden verwijderd omdat hij in één of meer gebruikersploegen zit."
            );
        }

        _context.Cyclists.Remove(cyclist);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Renner verwijderd"
        });
    }
}