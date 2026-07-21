using Microsoft.AspNetCore.Mvc;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/teams")]
public class TeamsController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public TeamsController(WielerspelDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetTeams()
    {
        return Ok(_context.Teams.ToList());
    }


    [HttpPost]
    public async Task<IActionResult> CreateTeam(Team team)
    {
        team.Id = Guid.NewGuid();

        _context.Teams.Add(team);

        await _context.SaveChangesAsync();

        return Ok(team);
    }
}