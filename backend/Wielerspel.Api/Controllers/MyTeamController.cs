using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/myteam")]
[Authorize]
public class MyTeamController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public MyTeamController(WielerspelDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        }

        if (userId == null)
        {
            throw new UnauthorizedAccessException("Geen user id gevonden in token.");
        }

        return Guid.Parse(userId);
    }

    // Mijn ploeg ophalen
    [HttpGet]
    public async Task<IActionResult> GetMyTeam()
    {
        var userId = GetUserId();

        var cyclists = await _context.UserCyclists
            .Where(x => x.UserId == userId)
            .Include(x => x.Cyclist)
            .ThenInclude(x => x.Team)
            .Select(x => x.Cyclist)
            .ToListAsync();

        return Ok(cyclists);
    }

    // Renner toevoegen
    [HttpPost("{cyclistId}")]
    public async Task<IActionResult> AddCyclist(Guid cyclistId)
    {
        var userId = GetUserId();

        var cyclistExists = await _context.Cyclists
            .AnyAsync(x => x.Id == cyclistId);

        if (!cyclistExists)
        {
            return NotFound("Renner bestaat niet.");
        }

        var alreadySelected = await _context.UserCyclists
            .AnyAsync(x =>
                x.UserId == userId &&
                x.CyclistId == cyclistId);

        if (alreadySelected)
        {
            return BadRequest("Deze renner zit al in je ploeg.");
        }

        var userCyclist = new UserCyclist
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CyclistId = cyclistId
        };

        _context.UserCyclists.Add(userCyclist);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Renner toegevoegd aan je ploeg"
        });
    }

    // Renner verwijderen
    [HttpDelete("{cyclistId}")]
    public async Task<IActionResult> RemoveCyclist(Guid cyclistId)
    {
        var userId = GetUserId();

        var userCyclist = await _context.UserCyclists
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.CyclistId == cyclistId);

        if (userCyclist == null)
        {
            return NotFound("Deze renner zit niet in je ploeg.");
        }

        _context.UserCyclists.Remove(userCyclist);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Renner verwijderd uit je ploeg"
        });
    }
}