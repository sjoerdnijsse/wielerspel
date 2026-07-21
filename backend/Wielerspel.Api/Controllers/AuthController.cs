using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Data;
using Wielerspel.Api.Models;
using Wielerspel.Api.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Wielerspel.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly WielerspelDbContext _context;

    public AuthController(WielerspelDbContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == request.Email);

        if (existingUser != null)
        {
            return BadRequest("E-mailadres bestaat al.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Player"
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
public async Task<IActionResult> Login(LoginRequest request)
{
    var user = await _context.Users
        .FirstOrDefaultAsync(x => x.Email == request.Email);

    if (user == null)
    {
        return Unauthorized("Ongeldige gegevens.");
    }

    var passwordValid = BCrypt.Net.BCrypt.Verify(
        request.Password,
        user.PasswordHash
    );

    if (!passwordValid)
    {
        return Unauthorized("Ongeldige gegevens.");
    }

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role)
    };

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes("WielerspelSuperGeheimeSleutel2026!")
    );

    var credentials = new SigningCredentials(
        key,
        SecurityAlgorithms.HmacSha256
    );

    var token = new JwtSecurityToken(
        issuer: "Wielerspel",
        audience: "Wielerspel",
        claims: claims,
        expires: DateTime.Now.AddHours(8),
        signingCredentials: credentials
    );

    return Ok(new
    {
        token = new JwtSecurityTokenHandler().WriteToken(token)
    });
}
}

public record RegisterRequest(
    string Name,
    string Email,
    string Password
);

