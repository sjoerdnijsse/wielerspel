namespace Wielerspel.Api.DTOs.Standings;

public class PlayerStandingDetailDto
{
    public Guid UserId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public int TotalPoints { get; set; }

    public DateTime TeamLockDate { get; set; }

    public bool TeamVisible { get; set; }

    public List<StageStandingPointsDto> StagePoints { get; set; }
        = new List<StageStandingPointsDto>();

    public List<PlayerTeamCyclistDto> Cyclists { get; set; }
        = new List<PlayerTeamCyclistDto>();
}