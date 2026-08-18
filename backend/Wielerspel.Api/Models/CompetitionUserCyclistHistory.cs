namespace Wielerspel.Api.Models;

public class CompetitionUserCyclistHistory
{
    public Guid Id { get; set; }

    public Guid CompetitionUserCyclistId { get; set; }

    public Guid CompetitionCyclistId { get; set; }

    public int FromStageNumber { get; set; }

    public int? ToStageNumber { get; set; }

    public CompetitionUserCyclist CompetitionUserCyclist
    {
        get;
        set;
    } = null!;

    public CompetitionCyclist CompetitionCyclist
    {
        get;
        set;
    } = null!;
}