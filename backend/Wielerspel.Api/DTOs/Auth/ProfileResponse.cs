namespace Wielerspel.Api.DTOs.Auth;

public class ProfileResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
}