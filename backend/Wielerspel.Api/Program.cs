using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Wielerspel.Api.Data;
using Wielerspel.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Render geeft de webservice een PORT-environment variable.
// Lokaal valt de applicatie terug op poort 10000.
var port =
    Environment.GetEnvironmentVariable("PORT")
    ?? "10000";

builder.WebHost.UseUrls(
    $"http://0.0.0.0:{port}"
);

// Lokaal gebruiken we de Vite-developmentserver.
// Op Render vullen we FrontendUrl als environment variable in.
var frontendUrl =
    builder.Configuration["FrontendUrl"]
    ?? "http://localhost:5173";

var allowedOrigins = new[]
{
    "http://localhost:5173",
    frontendUrl.TrimEnd('/')
}
.Distinct()
.ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var connectionString =
    builder.Configuration.GetConnectionString(
        "DefaultConnection"
    );

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "De databaseverbinding ontbreekt in de configuratie."
    );
}

builder.Services.AddDbContext<WielerspelDbContext>(
    options =>
        options.UseNpgsql(connectionString)
);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization
                .ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<TeamValidationService>();

// SMTP-instellingen uit appsettings.json of
// Render-environment variables laden.
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(
        "EmailSettings"
    )
);

builder.Services.AddScoped<
    IEmailService,
    EmailService
>();

var jwtKey =
    builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "De JWT-sleutel ontbreekt in de configuratie."
    );
}

var jwtIssuer =
    builder.Configuration["Jwt:Issuer"];

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException(
        "De JWT-issuer ontbreekt in de configuratie."
    );
}

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtIssuer,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtKey
                        )
                    ),

                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("ReactApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/status", () =>
{
    return new
    {
        app = "Wielerspel",
        status = "Online",
        version = "0.1"
    };
});

app.Run();