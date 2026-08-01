namespace Wielerspel.Api.Models;

public class StageResult
{
    public Guid Id { get; set; }

    public Guid StageId { get; set; }

    public Guid CompetitionCyclistId { get; set; }

    public int Position { get; set; }

    public int Points { get; set; }

    public Stage Stage { get; set; } = null!;

    public CompetitionCyclist CompetitionCyclist { get; set; } = null!;
}