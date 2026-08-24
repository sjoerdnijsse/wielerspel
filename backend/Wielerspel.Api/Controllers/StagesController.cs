using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;
using Wielerspel.Api.DTOs.Stages;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/competitions/{competitionId:guid}/stages")]
[Authorize]
public class StagesController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public StagesController(WielerspelDbContext context)
    {
        _context = context;
    }

    // Iedere ingelogde gebruiker mag de etappes van een actieve
    // competitie bekijken. Moderators mogen ook inactieve competities bekijken.
    [HttpGet]
    public async Task<IActionResult> GetStages(Guid competitionId)
    {
        var competition = await _context.Competitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        if (!competition.IsActive && !User.IsInRole("Moderator"))
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var stages = await _context.Stages
            .AsNoTracking()
            .Where(x => x.CompetitionId == competitionId)
            .OrderBy(x => x.StageNumber)
            .ToListAsync();

        var result = stages.Select(stage => new
        {
            stage.Id,
            stage.CompetitionId,
            stage.StageNumber,
            stage.StartLocation,
            stage.FinishLocation,
            stage.Date,
            stage.StartTime,
            stage.Type,
            typeName = GetStageTypeName(stage.Type),
            stage.ResultsPublished,
            stage.NoResult
        });

        return Ok(result);
    }

    // Eén etappe ophalen.
    [HttpGet("{stageId:guid}")]
    public async Task<IActionResult> GetStage(
        Guid competitionId,
        Guid stageId
    )
    {
        var competition = await _context.Competitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        if (!competition.IsActive && !User.IsInRole("Moderator"))
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var stage = await _context.Stages
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == stageId &&
                x.CompetitionId == competitionId
            );

        if (stage == null)
        {
            return NotFound("Etappe niet gevonden.");
        }

        return Ok(ToStageResponse(stage));
    }

    // Alleen moderators mogen een etappe toevoegen.
    [HttpPost]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> CreateStage(
        Guid competitionId,
        SaveStageRequest request
    )
    {
        var competitionExists = await _context.Competitions
            .AnyAsync(x => x.Id == competitionId);

        if (!competitionExists)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var validationResult = ValidateStageRequest(request);

        if (validationResult != null)
        {
            return validationResult;
        }

        var stageNumberExists = await _context.Stages
            .AnyAsync(x =>
                x.CompetitionId == competitionId &&
                x.StageNumber == request.StageNumber
            );

        if (stageNumberExists)
        {
            return BadRequest(
                "Er bestaat al een etappe met dit etappenummer."
            );
        }

        var stage = new Stage
        {
            CompetitionId = competitionId,
            StageNumber = request.StageNumber,
            StartLocation = request.StartLocation.Trim(),
            FinishLocation = request.FinishLocation.Trim(),
            Date = DateTime.SpecifyKind(
                request.Date,
                DateTimeKind.Utc
            ),
            Type = request.Type,
            StartTime = request.StartTime.HasValue
            ? DateTime.SpecifyKind(
            request.StartTime.Value,
            DateTimeKind.Utc)
            : null,
            ResultsPublished = false
        };

        _context.Stages.Add(stage);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetStage),
            new
            {
                competitionId,
                stageId = stage.Id
            },
            ToStageResponse(stage)
        );
    }

    // Alleen moderators mogen een etappe wijzigen.
    [HttpPut("{stageId:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UpdateStage(
        Guid competitionId,
        Guid stageId,
        SaveStageRequest request
    )
    {
        var existingStage = await _context.Stages
            .FirstOrDefaultAsync(x =>
                x.Id == stageId &&
                x.CompetitionId == competitionId
            );

        if (existingStage == null)
        {
            return NotFound("Etappe niet gevonden.");
        }

        var validationResult = ValidateStageRequest(request);

        if (validationResult != null)
        {
            return validationResult;
        }

        var stageNumberExists = await _context.Stages
            .AnyAsync(x =>
                x.CompetitionId == competitionId &&
                x.Id != stageId &&
                x.StageNumber == request.StageNumber
            );

        if (stageNumberExists)
        {
            return BadRequest(
                "Er bestaat al een etappe met dit etappenummer."
            );
        }

        existingStage.StageNumber = request.StageNumber;
        existingStage.StartLocation = request.StartLocation.Trim();
        existingStage.FinishLocation = request.FinishLocation.Trim();

        existingStage.Date = DateTime.SpecifyKind(
            request.Date,
    DateTimeKind.Utc
        );

        existingStage.StartTime = request.StartTime.HasValue
        ? DateTime.SpecifyKind(
            request.StartTime.Value,
            DateTimeKind.Utc)
        : null;

    existingStage.Type = request.Type;

        await _context.SaveChangesAsync();

        return Ok(ToStageResponse(existingStage));
    }

   [HttpPut("{stageId:guid}/publish-results")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> PublishResults(
        Guid competitionId,
        Guid stageId)
    {
        var stage = await _context.Stages
            .FirstOrDefaultAsync(stage =>
                stage.Id == stageId &&
                stage.CompetitionId == competitionId);

        if (stage == null)
        {
            return NotFound("Etappe niet gevonden.");
        }

        var hasResults = await _context.StageResults
            .AnyAsync(result => result.StageId == stageId);

        // Normaal moet er een uitslag zijn.
        // Bij een etappe met NoResult = true mag de
        // etappe zonder uitslag worden gepubliceerd.
        if (!hasResults && !stage.NoResult)
        {
            return BadRequest(
                "De uitslag kan niet worden gepubliceerd " +
                "omdat er nog geen resultaten zijn."
            );
        }

        stage.ResultsPublished = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            stage.Id,
            stage.NoResult,
            stage.ResultsPublished
        });
    }

    [HttpPut("{stageId:guid}/unpublish-results")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UnpublishResults(
        Guid competitionId,
        Guid stageId)
    {
        var stage = await _context.Stages
        .FirstOrDefaultAsync(stage =>
            stage.Id == stageId &&
            stage.CompetitionId == competitionId);

    if (stage == null)
    {
        return NotFound("Etappe niet gevonden.");
    }

    stage.ResultsPublished = false;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        stage.Id,
        stage.ResultsPublished
    });
    }

    // Alleen moderators mogen een etappe verwijderen.
    [HttpDelete("{stageId:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> DeleteStage(
        Guid competitionId,
        Guid stageId
    )
    {
        var stage = await _context.Stages
            .Include(x => x.Results)
            .FirstOrDefaultAsync(x =>
                x.Id == stageId &&
                x.CompetitionId == competitionId
            );

        if (stage == null)
        {
            return NotFound("Etappe niet gevonden.");
        }

        if (stage.Results.Count > 0)
        {
            return BadRequest(
                "Deze etappe kan niet worden verwijderd omdat er al uitslagen zijn ingevoerd."
            );
        }

        _context.Stages.Remove(stage);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Etappe verwijderd."
        });
    }

    private IActionResult? ValidateStageRequest(
        SaveStageRequest request
    )
    {
        if (request.StageNumber <= 0)
        {
            return BadRequest(
                "Het etappenummer moet groter zijn dan 0."
            );
        }

        if (string.IsNullOrWhiteSpace(request.StartLocation))
        {
            return BadRequest("Startplaats is verplicht.");
        }

        if (string.IsNullOrWhiteSpace(request.FinishLocation))
        {
            return BadRequest("Finishplaats is verplicht.");
        }

        if (request.Date == default)
        {
            return BadRequest("Vul een geldige datum in.");
        }

        if (!Enum.IsDefined(typeof(StageType), request.Type))
        {
            return BadRequest("Ongeldig etappetype.");
        }

        return null;
    }

    private static object ToStageResponse(Stage stage)
    {
        return new
        {
            stage.Id,
            stage.CompetitionId,
            stage.StageNumber,
            stage.StartLocation,
            stage.FinishLocation,
            stage.Date,
            stage.StartTime,
            stage.Type,
            typeName = GetStageTypeName(stage.Type),
            stage.ResultsPublished,
            stage.NoResult
        };
    }

    private static string GetStageTypeName(StageType type)
    {
        return type switch
        {
            StageType.Flat => "Vlak",
            StageType.Hilly => "Heuvel",
            StageType.Mountain => "Berg",
            StageType.TimeTrial => "Tijdrit",
            _ => "Onbekend"
        };
    }
}
