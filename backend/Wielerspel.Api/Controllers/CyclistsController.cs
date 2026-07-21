using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/cyclists")]
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
            .Include(x => x.Team)
            .ToListAsync();

        return Ok(cyclists);
    }


    [HttpPost]
    public async Task<IActionResult> CreateCyclist(Cyclist cyclist)
    {
        cyclist.Id = Guid.NewGuid();

        _context.Cyclists.Add(cyclist);

        await _context.SaveChangesAsync();

        return Ok(cyclist);
    }
}