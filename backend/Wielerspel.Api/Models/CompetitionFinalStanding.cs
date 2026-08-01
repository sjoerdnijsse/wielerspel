namespace Wielerspel.Api.Models;

public class CompetitionFinalStanding
{
    public Guid Id { get; set; }

    public Guid CompetitionId { get; set; }

    public Guid UserId { get; set; }

    public int Position { get; set; }

    public int TotalPoints { get; set; }

    public DateTime FinalizedAt { get; set; }

    public Competition Competition { get; set; } = null!;

    public User User { get; set; } = null!;
}