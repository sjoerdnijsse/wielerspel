namespace Wielerspel.Api.Models;

public class Stage
{
    public Guid Id { get; set; }

    public Guid CompetitionId { get; set; }

    public int StageNumber { get; set; }

    public string StartLocation { get; set; } = "";

    public string FinishLocation { get; set; } = "";

    public DateTime Date { get; set; }

    public DateTime? StartTime { get; set; }

    public StageType Type { get; set; }

    public bool ResultsPublished { get; set; }

    public bool NoResult { get; set; }

    public Guid? YellowJerseyCompetitionCyclistId { get; set; }

    public Guid? GreenJerseyCompetitionCyclistId { get; set; }

    public Guid? PolkaDotJerseyCompetitionCyclistId { get; set; }

    public Guid? WhiteJerseyCompetitionCyclistId { get; set; }

    public Competition Competition { get; set; } = null!;

    public CompetitionCyclist? YellowJerseyCompetitionCyclist
    {
        get;
        set;
    }

    public CompetitionCyclist? GreenJerseyCompetitionCyclist
    {
        get;
        set;
    }

    public CompetitionCyclist? PolkaDotJerseyCompetitionCyclist
    {
        get;
        set;
    }

    public CompetitionCyclist? WhiteJerseyCompetitionCyclist
    {
        get;
        set;
    }

    public ICollection<StageResult> Results { get; set; }
        = new List<StageResult>();
}