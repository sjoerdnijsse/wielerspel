namespace Wielerspel.Api.Models;

public class Team
{
    public Guid Id { get; set; }

    public string Name { get; set; } = "";

    public string? JerseyImageUrl { get; set; }

    public ICollection<Cyclist> Cyclists { get; set; } =
        new List<Cyclist>();
}