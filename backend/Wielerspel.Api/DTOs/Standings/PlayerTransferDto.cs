namespace Wielerspel.Api.DTOs.Standings;

public class PlayerTransferDto
{
    public int AfterStageNumber { get; set; }

    public string OutgoingCyclistName { get; set; }
        = string.Empty;

    public string IncomingCyclistName { get; set; }
        = string.Empty;

    public int OutgoingCyclistPoints { get; set; }
}