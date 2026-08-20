using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Wielerspel.Api.Data;
using Wielerspel.Api.DTOs;
using Wielerspel.Api.DTOs.Auth;
using Wielerspel.Api.Models;
using Wielerspel.Api.Services;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly WielerspelDbContext _context;
    private readonly IEmailService _emailService;
    private readonly EmailSettings _emailSettings;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public AuthController(
        WielerspelDbContext context,
        IEmailService emailService,
        IOptions<EmailSettings> emailSettings,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        _context = context;
        _emailService = emailService;
        _emailSettings = emailSettings.Value;
        _configuration = configuration;
        _environment = environment;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request
    )
    {
        var name = request.Name.Trim();
        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Naam is verplicht.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(
                "E-mailadres is verplicht."
            );
        }

        if (string.IsNullOrWhiteSpace(request.Password) ||
            request.Password.Length < 8)
        {
            return BadRequest(
                "Het wachtwoord moet minimaal 8 tekens bevatten."
            );
        }

        var existingUser = await _context.Users
            .AnyAsync(user =>
                user.Email.ToLower() == email
            );

        if (existingUser)
        {
            return BadRequest(
                "E-mailadres bestaat al."
            );
        }

        var existingName = await _context.Users
            .AnyAsync(user =>
                user.Name.ToLower() == name.ToLower()
            );

        if (existingName)
        {
            return BadRequest(
                "Deze naam is al in gebruik. Kies een andere naam."
            );
        }

        var initialModeratorEmail =
                _configuration["InitialModeratorEmail"]?
                    .Trim()
                    .ToLowerInvariant();

            var isInitialModerator =
                !string.IsNullOrWhiteSpace(
                    initialModeratorEmail
                ) &&
                email == initialModeratorEmail;

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = name,
                Email = email,
                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        request.Password
                    ),
                Role = isInitialModerator
                    ? "Moderator"
                    : "Player"
            };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Gebruiker aangemaakt",
            user.Id,
            user.Name,
            user.Email
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request
    )
    {
        var email = NormalizeEmail(request.Email);

        var user = await _context.Users
            .FirstOrDefaultAsync(user =>
                user.Email.ToLower() == email
            );

        if (user == null)
        {
            return Unauthorized(
                "Ongeldige gegevens."
            );
        }

        var passwordValid =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

        if (!passwordValid)
        {
            return Unauthorized(
                "Ongeldige gegevens."
            );
        }

        var jwtKey =
            _configuration["Jwt:Key"];

        var jwtIssuer =
            _configuration["Jwt:Issuer"];

        if (string.IsNullOrWhiteSpace(jwtKey) ||
            string.IsNullOrWhiteSpace(jwtIssuer))
        {
            return Problem(
                "De JWT-configuratie ontbreekt."
            );
        }

        var claims = new[]
        {
            new Claim(
                JwtRegisteredClaimNames.Sub,
                user.Id.ToString()
            ),

            new Claim(
                JwtRegisteredClaimNames.Email,
                user.Email
            ),

            new Claim(
                ClaimTypes.Role,
                user.Role
            )
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtIssuer,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: credentials
        );

        return Ok(new
        {
            token =
                new JwtSecurityTokenHandler()
                    .WriteToken(token)
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request
    )
    {
        var genericMessage =
            "Als het e-mailadres bij ons bekend is, " +
            "ontvang je een e-mail met instructies " +
            "om je wachtwoord opnieuw in te stellen.";

        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(email))
        {
            return Ok(new
            {
                message = genericMessage
            });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(user =>
                user.Email.ToLower() == email
            );

        // Altijd hetzelfde antwoord geven, zodat niemand
        // kan controleren welke e-mailadressen bestaan.
        if (user == null)
        {
            return Ok(new
            {
                message = genericMessage
            });
        }

        var token = CreatePasswordResetToken();

        user.PasswordResetTokenHash =
            HashPasswordResetToken(token);

        user.PasswordResetTokenExpiresAt =
            DateTime.UtcNow.AddMinutes(30);

        await _context.SaveChangesAsync();

        var baseUrl =
            _emailSettings.BaseUrl.TrimEnd('/');

        var resetUrl =
            $"{baseUrl}/?page=resetPassword" +
            $"&email={Uri.EscapeDataString(user.Email)}" +
            $"&token={Uri.EscapeDataString(token)}";

        var encodedName =
            WebUtility.HtmlEncode(user.Name);

        var encodedResetUrl =
            WebUtility.HtmlEncode(resetUrl);

        var htmlBody = $"""
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Wachtwoord opnieuw instellen</h2>

                <p>Hallo {encodedName},</p>

                <p>
                    Er is een verzoek ontvangen om het
                    wachtwoord van je Wielerspel-account
                    opnieuw in te stellen.
                </p>

                <p>
                    <a
                        href="{encodedResetUrl}"
                        style="
                            display: inline-block;
                            padding: 12px 18px;
                            border-radius: 8px;
                            background: #1f6f43;
                            color: white;
                            text-decoration: none;
                            font-weight: bold;
                        "
                    >
                        Nieuw wachtwoord instellen
                    </a>
                </p>

                <p>
                    Deze link is 30 minuten geldig en kan
                    slechts één keer worden gebruikt.
                </p>

                <p>
                    Heb je dit verzoek niet gedaan? Dan
                    kun je deze e-mail negeren.
                </p>

                <p>Met sportieve groet,<br>Wielerspel</p>
            </div>
            """;

        try
        {
            await _emailService.SendAsync(
                user.Email,
                "Wachtwoord opnieuw instellen",
                htmlBody
            );
        }
        catch (Exception exception)
        {
            // Een niet-verstuurd token mag niet geldig
            // in de database blijven staan.
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;

            await _context.SaveChangesAsync();

            Console.Error.WriteLine(
                $"Herstelmail versturen mislukt: {exception}"
            );

            // Alleen tijdens ontwikkeling duidelijk melden
            // dat de SMTP-configuratie nog niet werkt.
            if (_environment.IsDevelopment())
            {
                return StatusCode(
                    StatusCodes
                        .Status503ServiceUnavailable,
                    "De herstelmail kon niet worden " +
                    "verstuurd. Controleer de " +
                    "SMTP-instellingen."
                );
            }

            // Op productie geen technische informatie
            // of accountinformatie prijsgeven.
            return Ok(new
            {
                message = genericMessage
            });
        }

        return Ok(new
        {
            message = genericMessage
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request
    )
    {
        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(
                "De herstelgegevens zijn ongeldig."
            );
        }

        if (string.IsNullOrWhiteSpace(
                request.NewPassword
            ) ||
            request.NewPassword.Length < 8)
        {
            return BadRequest(
                "Het nieuwe wachtwoord moet minimaal " +
                "8 tekens bevatten."
            );
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(user =>
                user.Email.ToLower() == email
            );

        if (user == null ||
            string.IsNullOrWhiteSpace(
                user.PasswordResetTokenHash
            ) ||
            !user.PasswordResetTokenExpiresAt.HasValue ||
            user.PasswordResetTokenExpiresAt.Value <
                DateTime.UtcNow)
        {
            return BadRequest(
                "De herstel-link is ongeldig of verlopen."
            );
        }

        var submittedTokenHash =
            HashPasswordResetToken(request.Token);

        var expectedHashBytes =
            Convert.FromBase64String(
                user.PasswordResetTokenHash
            );

        var submittedHashBytes =
            Convert.FromBase64String(
                submittedTokenHash
            );

        var tokenValid =
            expectedHashBytes.Length ==
                submittedHashBytes.Length &&
            CryptographicOperations.FixedTimeEquals(
                expectedHashBytes,
                submittedHashBytes
            );

        if (!tokenValid)
        {
            return BadRequest(
                "De herstel-link is ongeldig of verlopen."
            );
        }

        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword
            );

        // Token na gebruik definitief ongeldig maken.
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Je wachtwoord is opnieuw ingesteld. " +
                "Je kunt nu inloggen."
        });
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == userId.Value);

        if (user == null)
        {
            return NotFound("Gebruiker niet gevonden.");
        }

        return Ok(new ProfileResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email
        });
    }
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(
        UpdateProfileRequest request
    )
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var name = request.Name.Trim();
        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Naam is verplicht.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest("E-mailadres is verplicht.");
        }

        var emailInUse = await _context.Users
            .AnyAsync(user =>
                user.Id != userId.Value &&
                user.Email.ToLower() == email
            );

        if (emailInUse)
        {
            return BadRequest(
                "Dit e-mailadres is al in gebruik."
            );
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(user =>
                user.Id == userId.Value
            );

        if (user == null)
        {
            return NotFound("Gebruiker niet gevonden.");
        }

        var nameInUse = await _context.Users
            .AnyAsync(user =>
                user.Id != userId.Value &&
                user.Name.ToLower() == name.ToLower()
            );

        if (nameInUse)
        {
            return BadRequest(
                "Deze naam is al in gebruik. Kies een andere naam."
            );
        }
        
        user.Name = name;
        user.Email = email;

        await _context.SaveChangesAsync();

        return Ok(new ProfileResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email
        });
    }
    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request
    )
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return BadRequest(
                "Vul je huidige wachtwoord in."
            );
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) ||
            request.NewPassword.Length < 8)
        {
            return BadRequest(
                "Het nieuwe wachtwoord moet minimaal 8 tekens bevatten."
            );
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(user =>
                user.Id == userId.Value
            );

        if (user == null)
        {
            return NotFound("Gebruiker niet gevonden.");
        }

        var passwordValid =
            BCrypt.Net.BCrypt.Verify(
                request.CurrentPassword,
                user.PasswordHash
            );

        if (!passwordValid)
        {
            return BadRequest(
                "Het huidige wachtwoord is niet correct."
            );
        }

        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword
            );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Je wachtwoord is gewijzigd."
        });
    }
    [HttpPut("make-moderator/{email}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> MakeModerator(
        string email
    )
    {
        var normalizedEmail =
            NormalizeEmail(email);

        var user = await _context.Users
            .FirstOrDefaultAsync(user =>
                user.Email.ToLower() ==
                normalizedEmail
            );

        if (user == null)
        {
            return NotFound(
                "Gebruiker niet gevonden."
            );
        }

        user.Role = "Moderator";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Gebruiker is moderator geworden",
            user.Email,
            user.Role
        });
    }

    private Guid? GetCurrentUserId()
    {
        var userIdValue =
            User.FindFirstValue(
                JwtRegisteredClaimNames.Sub
            );

        return Guid.TryParse(userIdValue, out var userId)
            ? userId
            : null;
    }
    
    private static string NormalizeEmail(
        string? email
    )
    {
        return email?
            .Trim()
            .ToLowerInvariant() ?? string.Empty;
    }

    private static string CreatePasswordResetToken()
    {
        var tokenBytes =
            RandomNumberGenerator.GetBytes(32);

        return Convert
            .ToBase64String(tokenBytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string HashPasswordResetToken(
        string token
    )
    {
        var tokenBytes =
            Encoding.UTF8.GetBytes(token);

        var hash =
            SHA256.HashData(tokenBytes);

        return Convert.ToBase64String(hash);
    }
}