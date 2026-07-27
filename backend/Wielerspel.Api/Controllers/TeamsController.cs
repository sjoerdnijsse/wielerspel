using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/teams")]
[Authorize(Roles = "Moderator")]
public class TeamsController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public TeamsController(WielerspelDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTeams()
    {
        var teams = await _context.Teams
            .OrderBy(team => team.Name)
            .ToListAsync();

        return Ok(teams);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTeam(Team team)
    {
        var name = team.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Ploegnaam is verplicht.");
        }

        var alreadyExists = await _context.Teams
            .AnyAsync(existingTeam => existingTeam.Name.ToLower() == name.ToLower());

        if (alreadyExists)
        {
            return BadRequest("Deze ploeg bestaat al.");
        }

        var newTeam = new Team
        {
            Id = Guid.NewGuid(),
            Name = name
        };

        _context.Teams.Add(newTeam);
        await _context.SaveChangesAsync();

        return Ok(newTeam);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTeam(Guid id, Team team)
    {
        var existingTeam = await _context.Teams.FindAsync(id);

        if (existingTeam == null)
        {
            return NotFound("Ploeg niet gevonden.");
        }

        var name = team.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Ploegnaam is verplicht.");
        }

        var duplicateExists = await _context.Teams
            .AnyAsync(otherTeam =>
                otherTeam.Id != id &&
                otherTeam.Name.ToLower() == name.ToLower());

        if (duplicateExists)
        {
            return BadRequest("Er bestaat al een ploeg met deze naam.");
        }

        existingTeam.Name = name;

        await _context.SaveChangesAsync();

        return Ok(existingTeam);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTeam(Guid id)
    {
        var team = await _context.Teams
            .Include(existingTeam => existingTeam.Cyclists)
            .FirstOrDefaultAsync(existingTeam => existingTeam.Id == id);

        if (team == null)
        {
            return NotFound("Ploeg niet gevonden.");
        }

        if (team.Cyclists.Count > 0)
        {
            return BadRequest(
                "Deze ploeg kan niet worden verwijderd omdat er nog renners aan gekoppeld zijn."
            );
        }

        _context.Teams.Remove(team);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Ploeg verwijderd"
        });
    }
}