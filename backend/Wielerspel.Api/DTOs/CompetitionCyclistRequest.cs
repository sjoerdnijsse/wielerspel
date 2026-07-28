namespace Wielerspel.Api.DTOs;

public class CompetitionCyclistRequest
{
    public Guid CyclistId { get; set; }

    public int Number { get; set; }

    public int Price { get; set; }
}