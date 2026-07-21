namespace Wielerspel.Api.DTOs;

public record RegisterRequest(
    string Name,
    string Email,
    string Password
);