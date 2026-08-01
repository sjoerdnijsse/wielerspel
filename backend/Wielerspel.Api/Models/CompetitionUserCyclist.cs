namespace Wielerspel.Api.Models;

public class CompetitionUserCyclist
{
    public Guid Id { get; set; }

    public Guid CompetitionUserId { get; set; }

    public Guid CompetitionCyclistId { get; set; }

    public Guid? JokerStageId { get; set; }

    public CompetitionUser CompetitionUser { get; set; } = null!;

    public CompetitionCyclist CompetitionCyclist { get; set; } = null!;

    public Stage? JokerStage { get; set; }
}