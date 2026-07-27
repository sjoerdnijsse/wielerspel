using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;
using Microsoft.AspNetCore.Authorization;

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


    // Iedereen die ingelogd is mag renners bekijken
    [HttpGet]
    public async Task<IActionResult> GetCyclists()
    {
        var cyclists = await _context.Cyclists
            .Include(x => x.Team)
            .ToListAsync();

        return Ok(cyclists);
    }


    // Alleen moderators mogen renners toevoegen
    [HttpPost]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> CreateCyclist(Cyclist cyclist)
    {
        cyclist.Id = Guid.NewGuid();

        _context.Cyclists.Add(cyclist);

        await _context.SaveChangesAsync();

        return Ok(cyclist);
    }
}