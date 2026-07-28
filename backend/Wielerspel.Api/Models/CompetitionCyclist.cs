namespace Wielerspel.Api.Models;

public class CompetitionCyclist
{
    public Guid Id { get; set; }

    public Guid CompetitionId { get; set; }

    public Guid CyclistId { get; set; }

    public int Number { get; set; }

    // Prijs in hele miljoenen
    public int Price { get; set; }

    public Competition Competition { get; set; } = null!;

    public Cyclist Cyclist { get; set; } = null!;

    public ICollection<CompetitionUserCyclist> CompetitionUserCyclists
        { get; set; } = new List<CompetitionUserCyclist>();
}