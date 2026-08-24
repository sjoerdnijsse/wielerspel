namespace Wielerspel.Api.DTOs.Standings;

public class StageStandingPointsDto
{
    public Guid StageId { get; set; }

    public int StageNumber { get; set; }

    public bool NoResult { get; set; }

    public int StageResultPoints { get; set; }

    public int JokerPoints { get; set; }

    public int YellowJerseyPoints { get; set; }

    public int GreenJerseyPoints { get; set; }

    public int PolkaDotJerseyPoints { get; set; }

    public int WhiteJerseyPoints { get; set; }

    public int Points =>
        StageResultPoints +
        JokerPoints +
        YellowJerseyPoints +
        GreenJerseyPoints +
        PolkaDotJerseyPoints +
        WhiteJerseyPoints;
}