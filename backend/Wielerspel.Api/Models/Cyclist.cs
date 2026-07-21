namespace Wielerspel.Api.Models;

public class Cyclist
{
    public Guid Id { get; set; }

    public string Name { get; set; } = "";

    public int Number { get; set; }

    public Guid TeamId { get; set; }

    public Team? Team { get; set; }
}