namespace Wielerspel.Api.Models;

public class CompetitionUser
{
    public Guid Id { get; set; }

    public Guid CompetitionId { get; set; }

    public Guid UserId { get; set; }

    public int TransfersUsed { get; set; }

    public bool TeamLocked { get; set; }

    public Competition Competition { get; set; } = null!;

    public User User { get; set; } = null!;

    public ICollection<CompetitionUserCyclist> Cyclists { get; set; }
        = new List<CompetitionUserCyclist>();
}