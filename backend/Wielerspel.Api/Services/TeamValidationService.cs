using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;

namespace Wielerspel.Api.Services;

public class TeamValidationService
{
    private readonly WielerspelDbContext _context;

    public TeamValidationService(WielerspelDbContext context)
    {
        _context = context;
    }

    public async Task<int> GetCurrentTeamSize(
        Guid userId,
        Guid competitionId
    )
    {
        var competitionUserId = await _context.CompetitionUsers
            .Where(x =>
                x.UserId == userId &&
                x.CompetitionId == competitionId
            )
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync();

        if (competitionUserId == null)
        {
            return 0;
        }

        return await _context.CompetitionUserCyclists
            .CountAsync(x =>
                x.CompetitionUserId == competitionUserId.Value
            );
    }

    public async Task<int> GetCurrentBudget(
        Guid userId,
        Guid competitionId
    )
    {
        var competitionUserId = await _context.CompetitionUsers
            .Where(x =>
                x.UserId == userId &&
                x.CompetitionId == competitionId
            )
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync();

        if (competitionUserId == null)
        {
            return 0;
        }

        return await _context.CompetitionUserCyclists
            .Where(x =>
                x.CompetitionUserId == competitionUserId.Value
            )
            .SumAsync(x => x.CompetitionCyclist.Price);
    }

    public async Task<bool> IsCyclistAlreadySelected(
        Guid userId,
        Guid competitionId,
        Guid competitionCyclistId
    )
    {
        return await _context.CompetitionUserCyclists
            .AnyAsync(x =>
                x.CompetitionUser.UserId == userId &&
                x.CompetitionUser.CompetitionId == competitionId &&
                x.CompetitionCyclistId == competitionCyclistId
            );
    }

    public async Task<bool> CanAddCyclist(
        Guid userId,
        Guid competitionId,
        Guid competitionCyclistId
    )
    {
        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return false;
        }

        var competitionCyclist = await _context.CompetitionCyclists
            .FirstOrDefaultAsync(x =>
                x.Id == competitionCyclistId &&
                x.CompetitionId == competitionId
            );

        if (competitionCyclist == null)
        {
            return false;
        }

        if (await IsCyclistAlreadySelected(
                userId,
                competitionId,
                competitionCyclistId
            ))
        {
            return false;
        }

        var currentTeamSize = await GetCurrentTeamSize(
            userId,
            competitionId
        );

        if (currentTeamSize >= competition.TeamSize)
        {
            return false;
        }

        var currentBudget = await GetCurrentBudget(
            userId,
            competitionId
        );

        return currentBudget + competitionCyclist.Price
            <= competition.Budget;
    }

    public async Task<bool> CanRemoveCyclist(
        Guid userId,
        Guid competitionId,
        Guid competitionCyclistId
    )
    {
        var competition = await _context.Competitions
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return false;
        }

        if (DateTime.UtcNow >= competition.TeamLockDate.ToUniversalTime())
        {
            return false;
        }

        return await IsCyclistAlreadySelected(
            userId,
            competitionId,
            competitionCyclistId
        );
    }
}