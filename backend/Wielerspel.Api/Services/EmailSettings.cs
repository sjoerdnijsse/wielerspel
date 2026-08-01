namespace Wielerspel.Api.Services;

public class EmailSettings
{
    public string Host { get; set; } = "";

    public int Port { get; set; }

    public bool UseSsl { get; set; }

    public string Username { get; set; } = "";

    public string Password { get; set; } = "";

    public string FromEmail { get; set; } = "";

    public string FromName { get; set; } = "Wielerspel";

    public string BaseUrl { get; set; } = "";
}