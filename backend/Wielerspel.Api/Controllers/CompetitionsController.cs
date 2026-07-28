using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/competitions")]
[Authorize]
public class CompetitionsController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public CompetitionsController(WielerspelDbContext context)
    {
        _context = context;
    }

    // Iedere ingelogde gebruiker mag actieve competities bekijken.
    [HttpGet]
    public async Task<IActionResult> GetCompetitions()
    {
        var competitions = await _context.Competitions
            .AsNoTracking()
            .Where(competition => competition.IsActive)
            .OrderByDescending(competition => competition.Year)
            .ThenBy(competition => competition.Name)
            .ToListAsync();

        return Ok(competitions);
    }

    // Alleen moderators mogen alle competities bekijken,
    // inclusief niet-actieve competities.
    [HttpGet("admin")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetCompetitionsForAdmin()
    {
        var competitions = await _context.Competitions
            .AsNoTracking()
            .OrderByDescending(competition => competition.Year)
            .ThenBy(competition => competition.Name)
            .ToListAsync();

        return Ok(competitions);
    }

    // Alleen moderators mogen een competitie toevoegen.
    [HttpPost]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> CreateCompetition(
        Competition competition
    )
    {
        var validationResult = ValidateCompetition(competition);

        if (validationResult != null)
        {
            return validationResult;
        }

        var name = competition.Name.Trim();

        var duplicateExists = await _context.Competitions
            .AnyAsync(existingCompetition =>
                existingCompetition.Name.ToLower() == name.ToLower() &&
                existingCompetition.Year == competition.Year
            );

        if (duplicateExists)
        {
            return BadRequest(
                "Er bestaat al een wedstrijd met deze naam en dit jaar."
            );
        }

        var newCompetition = new Competition
        {
            Id = Guid.NewGuid(),
            Name = name,
            Year = competition.Year,
            TeamSize = competition.TeamSize,
            Budget = competition.Budget,
            MaxTransfers = competition.MaxTransfers,
            TeamLockDate = competition.TeamLockDate,
            IsActive = competition.IsActive
        };

        _context.Competitions.Add(newCompetition);
        await _context.SaveChangesAsync();

        return Ok(newCompetition);
    }

    // Alleen moderators mogen een competitie wijzigen.
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UpdateCompetition(
        Guid id,
        Competition competition
    )
    {
        var existingCompetition = await _context.Competitions
            .FirstOrDefaultAsync(item => item.Id == id);

        if (existingCompetition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        var validationResult = ValidateCompetition(competition);

        if (validationResult != null)
        {
            return validationResult;
        }

        var name = competition.Name.Trim();

        var duplicateExists = await _context.Competitions
            .AnyAsync(otherCompetition =>
                otherCompetition.Id != id &&
                otherCompetition.Name.ToLower() == name.ToLower() &&
                otherCompetition.Year == competition.Year
            );

        if (duplicateExists)
        {
            return BadRequest(
                "Er bestaat al een wedstrijd met deze naam en dit jaar."
            );
        }

        existingCompetition.Name = name;
        existingCompetition.Year = competition.Year;
        existingCompetition.TeamSize = competition.TeamSize;
        existingCompetition.Budget = competition.Budget;
        existingCompetition.MaxTransfers = competition.MaxTransfers;
        existingCompetition.TeamLockDate = competition.TeamLockDate;
        existingCompetition.IsActive = competition.IsActive;

        await _context.SaveChangesAsync();

        return Ok(existingCompetition);
    }

    // Alleen moderators mogen een competitie verwijderen.
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> DeleteCompetition(Guid id)
    {
        var competition = await _context.Competitions
            .Include(item => item.CompetitionCyclists)
            .Include(item => item.CompetitionUsers)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (competition == null)
        {
            return NotFound("Wedstrijd niet gevonden.");
        }

        if (competition.CompetitionCyclists.Count > 0)
        {
            return BadRequest(
                "Deze wedstrijd kan niet worden verwijderd omdat er renners aan gekoppeld zijn."
            );
        }

        if (competition.CompetitionUsers.Count > 0)
        {
            return BadRequest(
                "Deze wedstrijd kan niet worden verwijderd omdat er deelnemers aan gekoppeld zijn."
            );
        }

        _context.Competitions.Remove(competition);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Wedstrijd verwijderd"
        });
    }

    private IActionResult? ValidateCompetition(
        Competition competition
    )
    {
        if (string.IsNullOrWhiteSpace(competition.Name))
        {
            return BadRequest("Naam is verplicht.");
        }

        if (competition.Year < 2000 || competition.Year > 2200)
        {
            return BadRequest("Vul een geldig jaar in.");
        }

        if (competition.TeamSize <= 0)
        {
            return BadRequest(
                "Ploeggrootte moet groter zijn dan 0."
            );
        }

        if (competition.Budget <= 0)
        {
            return BadRequest(
                "Budget moet groter zijn dan 0 miljoen."
            );
        }

        if (competition.MaxTransfers < 0)
        {
            return BadRequest(
                "Het maximale aantal wissels mag niet negatief zijn."
            );
        }

        if (competition.TeamLockDate == default)
        {
            return BadRequest(
                "Vul een geldige deadline in."
            );
        }

        return null;
    }
}