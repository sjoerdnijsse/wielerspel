using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.DTOs.StageResults;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route(
    "api/competitions/{competitionId:guid}/stages/{stageId:guid}/results"
)]
[Authorize]
public class StageResultsController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public StageResultsController(
        WielerspelDbContext context
    )
    {
        _context = context;
    }

    // Uitslag en truiendragers van een etappe ophalen
    [HttpGet]
    public async Task<IActionResult> GetResults(
        Guid competitionId,
        Guid stageId
    )
    {
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

        var results = await _context.StageResults
            .AsNoTracking()
            .Where(x => x.StageId == stageId)
            .OrderBy(x => x.Position)
            .Select(x => new
            {
                x.StageId,
                x.CompetitionCyclistId,
                CyclistName =
                    x.CompetitionCyclist.Cyclist.Name,
                x.Position,
                x.Points
            })
            .ToListAsync();

        return Ok(new
        {
            results,
            stage.YellowJerseyCompetitionCyclistId,
            stage.GreenJerseyCompetitionCyclistId,
            stage.PolkaDotJerseyCompetitionCyclistId,
            stage.WhiteJerseyCompetitionCyclistId,
            stage.NoResult,
            stage.ResultsPublished
        });
    }

    // Complete uitslag en truiendragers opslaan/vervangen
    [HttpPut]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> SaveResults(
        Guid competitionId,
        Guid stageId,
        SaveStageResultsRequest request
    )
    {
        var stage = await _context.Stages
            .FirstOrDefaultAsync(x =>
                x.Id == stageId &&
                x.CompetitionId == competitionId
            );

        if (stage == null)
        {
            return NotFound("Etappe niet gevonden.");
        }

        // -----------------------------------------
        // GEEN UITSLAG
        // -----------------------------------------

        if (request.NoResult)
        {
            var oldResults = await _context.StageResults
                .Where(x => x.StageId == stageId)
                .ToListAsync();

            _context.StageResults.RemoveRange(oldResults);

            stage.YellowJerseyCompetitionCyclistId = null;
            stage.GreenJerseyCompetitionCyclistId = null;
            stage.PolkaDotJerseyCompetitionCyclistId = null;
            stage.WhiteJerseyCompetitionCyclistId = null;

            stage.NoResult = true;

            // Eerst opslaan. Publiceren gebeurt via
            // het bestaande publicatieproces.
            stage.ResultsPublished = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Etappe opgeslagen zonder uitslag."
            });
        }

        // -----------------------------------------
        // NORMALE UITSLAG
        // -----------------------------------------

        if (request.Results == null ||
            request.Results.Count == 0)
        {
            return BadRequest(
                "Geen uitslagen ontvangen."
            );
        }

        if (request.Results.Count > 15)
        {
            return BadRequest(
                "Een etappe-uitslag mag maximaal " +
                "15 renners bevatten."
            );
        }

        if (request.Results.Any(result =>
                result.Position < 1 ||
                result.Position > 15))
        {
            return BadRequest(
                "Alleen posities 1 tot en met 15 " +
                "zijn toegestaan."
            );
        }

        var duplicatePositions = request.Results
            .GroupBy(x => x.Position)
            .Any(group => group.Count() > 1);

        if (duplicatePositions)
        {
            return BadRequest(
                "Dubbele klasseringen gevonden."
            );
        }

        var duplicateCyclists = request.Results
            .GroupBy(x => x.CompetitionCyclistId)
            .Any(group => group.Count() > 1);

        if (duplicateCyclists)
        {
            return BadRequest(
                "Een renner komt meerdere keren " +
                "in de etappe-uitslag voor."
            );
        }

        var orderedPositions = request.Results
            .Select(x => x.Position)
            .OrderBy(position => position)
            .ToList();

        for (
            var index = 0;
            index < orderedPositions.Count;
            index++
        )
        {
            var expectedPosition = index + 1;

            if (orderedPositions[index] != expectedPosition)
            {
                return BadRequest(
                    "Vul de uitslag zonder lege " +
                    "posities in."
                );
            }
        }

        if (
            request.YellowJerseyCompetitionCyclistId
                == null ||
            request.GreenJerseyCompetitionCyclistId
                == null ||
            request.PolkaDotJerseyCompetitionCyclistId
                == null ||
            request.WhiteJerseyCompetitionCyclistId
                == null
        )
        {
            return BadRequest(
                "Selecteer de drager van de " +
                "leiderstrui, puntentrui, bergtrui " +
                "en witte trui."
            );
        }

        var submittedCyclistIds = request.Results
            .Select(x => x.CompetitionCyclistId)
            .Append(
                request
                    .YellowJerseyCompetitionCyclistId
                    .Value
            )
            .Append(
                request
                    .GreenJerseyCompetitionCyclistId
                    .Value
            )
            .Append(
                request
                    .PolkaDotJerseyCompetitionCyclistId
                    .Value
            )
            .Append(
                request
                    .WhiteJerseyCompetitionCyclistId
                    .Value
            )
            .Distinct()
            .ToList();

        var validCyclistIds =
            await _context.CompetitionCyclists
                .AsNoTracking()
                .Where(x =>
                    x.CompetitionId == competitionId &&
                    submittedCyclistIds.Contains(x.Id)
                )
                .Select(x => x.Id)
                .ToListAsync();

        if (
            validCyclistIds.Count !=
            submittedCyclistIds.Count
        )
        {
            return BadRequest(
                "Een of meer geselecteerde renners " +
                "horen niet bij deze competitie."
            );
        }

        var existingResults =
            await _context.StageResults
                .Where(x => x.StageId == stageId)
                .ToListAsync();

        _context.StageResults.RemoveRange(
            existingResults
        );

        foreach (var result in request.Results)
        {
            _context.StageResults.Add(
                new StageResult
                {
                    StageId = stageId,
                    CompetitionCyclistId =
                        result.CompetitionCyclistId,
                    Position = result.Position,
                    Points = GetPointsForPosition(
                        result.Position
                    )
                }
            );
        }

        stage.YellowJerseyCompetitionCyclistId =
            request.YellowJerseyCompetitionCyclistId;

        stage.GreenJerseyCompetitionCyclistId =
            request.GreenJerseyCompetitionCyclistId;

        stage.PolkaDotJerseyCompetitionCyclistId =
            request.PolkaDotJerseyCompetitionCyclistId;

        stage.WhiteJerseyCompetitionCyclistId =
            request.WhiteJerseyCompetitionCyclistId;

        // Het is weer een normale uitslag.
        stage.NoResult = false;

        // Een gewijzigde uitslag moet opnieuw
        // gepubliceerd worden.
        stage.ResultsPublished = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Uitslag en truiendragers opgeslagen."
        });
    }

    // Uitslag en truiendragers verwijderen
    [HttpDelete]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> DeleteResults(
        Guid competitionId,
        Guid stageId
    )
    {
        var stage = await _context.Stages
            .FirstOrDefaultAsync(x =>
                x.Id == stageId &&
                x.CompetitionId == competitionId
            );

        if (stage == null)
        {
            return NotFound("Etappe niet gevonden.");
        }

        var results = await _context.StageResults
            .Where(x => x.StageId == stageId)
            .ToListAsync();

        _context.StageResults.RemoveRange(results);

        stage.YellowJerseyCompetitionCyclistId = null;
        stage.GreenJerseyCompetitionCyclistId = null;
        stage.PolkaDotJerseyCompetitionCyclistId = null;
        stage.WhiteJerseyCompetitionCyclistId = null;

        stage.NoResult = false;
        stage.ResultsPublished = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Uitslag en truiendragers verwijderd."
        });
    }

    private static int GetPointsForPosition(
        int position
    )
    {
        return position switch
        {
            1 => 20,
            2 => 17,
            3 => 15,
            4 => 13,
            5 => 11,
            6 => 10,
            7 => 9,
            8 => 8,
            9 => 7,
            10 => 6,
            11 => 5,
            12 => 4,
            13 => 3,
            14 => 2,
            15 => 1,
            _ => 0
        };
    }
}