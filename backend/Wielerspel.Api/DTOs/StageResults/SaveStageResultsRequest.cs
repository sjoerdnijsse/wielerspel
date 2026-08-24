using System.Collections.Generic;

namespace Wielerspel.Api.DTOs.StageResults;

public class SaveStageResultsRequest
{
    public List<SaveStageResultRequest> Results { get; set; }
        = new();

    public Guid? YellowJerseyCompetitionCyclistId
    {
        get;
        set;
    }

    public Guid? GreenJerseyCompetitionCyclistId
    {
        get;
        set;
    }

    public Guid? PolkaDotJerseyCompetitionCyclistId
    {
        get;
        set;
    }

    public Guid? WhiteJerseyCompetitionCyclistId
    {
        get;
        set;
    }

    public bool NoResult { get; set; }
}