namespace Wielerspel.Api.Models;

public class Competition
{
    public Guid Id { get; set; }

    public string Name { get; set; } = "";

    public int Year { get; set; }

    public int TeamSize { get; set; } = 15;

    public int Budget { get; set; } = 100;

    public int MaxTransfers { get; set; } = 3;

    public DateTime TeamLockDate { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<CompetitionCyclist> CompetitionCyclists { get; set; }
        = new List<CompetitionCyclist>();

    public ICollection<CompetitionUser> CompetitionUsers { get; set; }
        = new List<CompetitionUser>();
}