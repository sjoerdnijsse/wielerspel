namespace Wielerspel.Api.Models;

public class Team
{
    public Guid Id { get; set; }

    public string Name { get; set; } = "";

    public List<Cyclist> Cyclists { get; set; } = new();
}