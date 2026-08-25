namespace Wielerspel.Api.DTOs.Standings;

public class StageCyclistPointsDto
{
    public Guid CompetitionCyclistId { get; set; }

    public string CyclistName { get; set; } = string.Empty;

    public string TeamName { get; set; } = string.Empty;

    public string? JerseyImageUrl { get; set; }

    public int Points { get; set; }
}