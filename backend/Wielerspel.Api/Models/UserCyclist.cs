namespace Wielerspel.Api.Models;

public class UserCyclist
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid CyclistId { get; set; }


    public User User { get; set; } = null!;

    public Cyclist Cyclist { get; set; } = null!;
}