using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/hall-of-fame")]
[Authorize]
public class HallOfFameController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public HallOfFameController(
        WielerspelDbContext context
    )
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHallOfFame()
    {
        var finishedCompetitions =
            await _context.Competitions
                .AsNoTracking()
                .Where(competition =>
                    competition.IsFinished
                )
                .OrderByDescending(competition =>
                    competition.FinishedAt
                )
                .ThenByDescending(competition =>
                    competition.Year
                )
                .ThenBy(competition =>
                    competition.Name
                )
                .Select(competition => new
                {
                    competition.Id,
                    competition.Name,
                    competition.Year,
                    competition.FinishedAt
                })
                .ToListAsync();

        var finishedCompetitionIds =
            finishedCompetitions
                .Select(competition =>
                    competition.Id
                )
                .ToList();

        var finalStandings =
            await _context.CompetitionFinalStandings
                .AsNoTracking()
                .Where(standing =>
                    finishedCompetitionIds.Contains(
                        standing.CompetitionId
                    )
                )
                .Select(standing => new
                {
                    standing.CompetitionId,
                    standing.UserId,
                    UserName = standing.User.Name,
                    standing.Position,
                    standing.TotalPoints
                })
                .ToListAsync();

        var competitions =
            finishedCompetitions
                .Select(competition => new
                {
                    competitionId = competition.Id,
                    competitionName = competition.Name,
                    competition.Year,
                    competition.FinishedAt,

                    topThree = finalStandings
                        .Where(standing =>
                            standing.CompetitionId ==
                            competition.Id &&
                            standing.Position <= 3
                        )
                        .OrderBy(standing =>
                            standing.Position
                        )
                        .Select(standing => new
                        {
                            standing.Position,
                            standing.UserId,
                            standing.UserName,
                            standing.TotalPoints
                        })
                        .ToList()
                })
                .ToList();

        var mostWins =
            finalStandings
                .Where(standing =>
                    standing.Position == 1
                )
                .GroupBy(standing => new
                {
                    standing.UserId,
                    standing.UserName
                })
                .Select(group => new
                {
                    group.Key.UserId,
                    group.Key.UserName,
                    Wins = group.Count()
                })
                .OrderByDescending(result =>
                    result.Wins
                )
                .ThenBy(result =>
                    result.UserName
                )
                .ToList();

        return Ok(new
        {
            competitions,
            mostWins
        });
    }
}