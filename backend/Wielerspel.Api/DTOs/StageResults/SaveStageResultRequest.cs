namespace Wielerspel.Api.DTOs.StageResults;

public class SaveStageResultRequest
{
    public Guid CompetitionCyclistId { get; set; }

    public int Position { get; set; }
}