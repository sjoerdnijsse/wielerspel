using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace Wielerspel.Api.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(
        IOptions<EmailSettings> settings
    )
    {
        _settings = settings.Value;
    }

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody
    )
    {
        using var client = new SmtpClient(
            _settings.Host,
            _settings.Port
        );

        client.EnableSsl = _settings.UseSsl;

        client.Credentials =
            new NetworkCredential(
                _settings.Username,
                _settings.Password
            );

        using var message = new MailMessage();

        message.From = new MailAddress(
            _settings.FromEmail,
            _settings.FromName
        );

        message.To.Add(toEmail);

        message.Subject = subject;

        message.Body = htmlBody;

        message.IsBodyHtml = true;

        await client.SendMailAsync(message);
    }
}