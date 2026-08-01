namespace Wielerspel.Api.DTOs.Standings;

public class CompetitionStandingDto
{
    public Guid UserId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public int TotalPoints { get; set; }
}