using Wielerspel.Api.Models;

namespace Wielerspel.Api.DTOs.Stages;

public class SaveStageRequest
{
    public int StageNumber { get; set; }

    public DateTime Date { get; set; }

    public DateTime? StartTime { get; set; }

    public string StartLocation { get; set; } = string.Empty;

    public string FinishLocation { get; set; } = string.Empty;

    public StageType Type { get; set; }
}