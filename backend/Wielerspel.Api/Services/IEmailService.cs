namespace Wielerspel.Api.Services;

public interface IEmailService
{
    Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody
    );
}