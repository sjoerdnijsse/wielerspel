namespace Wielerspel.Api.DTOs.Standings;

public class PlayerTeamCyclistDto
{
    public Guid CompetitionCyclistId { get; set; }

    public Guid CyclistId { get; set; }

    public string CyclistName { get; set; } = string.Empty;

    public Guid TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public int Number { get; set; }

    public int Price { get; set; }

    public int? JokerStageNumber { get; set; }
}