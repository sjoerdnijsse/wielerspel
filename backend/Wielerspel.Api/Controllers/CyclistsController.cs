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

    [HttpGet]
    public async Task<IActionResult> GetCyclists()
    {
        var cyclists = await _context.Cyclists
            .AsNoTracking()
            .Include(cyclist => cyclist.Team)
            .OrderBy(cyclist => cyclist.Name)
            .Select(cyclist => new
            {
                cyclist.Id,
                cyclist.Name,
                cyclist.TeamId,

                Team = cyclist.Team == null
                    ? null
                    : new
                    {
                        cyclist.Team.Id,
                        cyclist.Team.Name
                    }
            })
            .ToListAsync();

        return Ok(cyclists);
    }

    [HttpPost]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> CreateCyclist(Cyclist cyclist)
    {
        var name = cyclist.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Naam van de renner is verplicht.");
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
            TeamId = cyclist.TeamId
        };

        _context.Cyclists.Add(newCyclist);
        await _context.SaveChangesAsync();

        var createdCyclist = await _context.Cyclists
            .AsNoTracking()
            .Include(item => item.Team)
            .Where(item => item.Id == newCyclist.Id)
            .Select(item => new
            {
                item.Id,
                item.Name,
                item.TeamId,

                Team = item.Team == null
                    ? null
                    : new
                    {
                        item.Team.Id,
                        item.Team.Name
                    }
            })
            .FirstAsync();

        return Ok(createdCyclist);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UpdateCyclist(
        Guid id,
        Cyclist cyclist
    )
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
            return BadRequest(
                "Er bestaat al een renner met deze naam."
            );
        }

        existingCyclist.Name = name;
        existingCyclist.TeamId = cyclist.TeamId;

        await _context.SaveChangesAsync();

        var updatedCyclist = await _context.Cyclists
            .AsNoTracking()
            .Include(item => item.Team)
            .Where(item => item.Id == id)
            .Select(item => new
            {
                item.Id,
                item.Name,
                item.TeamId,

                Team = item.Team == null
                    ? null
                    : new
                    {
                        item.Team.Id,
                        item.Team.Name
                    }
            })
            .FirstAsync();

        return Ok(updatedCyclist);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> DeleteCyclist(Guid id)
    {
        var cyclist = await _context.Cyclists
            .Include(item => item.CompetitionCyclists)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (cyclist == null)
        {
            return NotFound("Renner niet gevonden.");
        }

        if (cyclist.CompetitionCyclists.Count > 0)
        {
            return BadRequest(
                "Deze renner kan niet worden verwijderd omdat hij aan één of meer wedstrijden is gekoppeld."
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