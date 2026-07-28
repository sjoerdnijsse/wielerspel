namespace Wielerspel.Api.Models;

public class GameSettings
{
    public Guid Id { get; set; }

    public int TeamSize { get; set; } = 15;

    public int Budget { get; set; } = 100;

    public int MaxTransfers { get; set; } = 3;

    public DateTime TeamLockDate { get; set; }

    public bool GameStarted { get; set; } = false;
}