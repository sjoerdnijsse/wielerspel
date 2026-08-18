using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Data;

public class WielerspelDbContext : DbContext
{
    public WielerspelDbContext(
        DbContextOptions<WielerspelDbContext> options
    ) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<Team> Teams { get; set; }

    public DbSet<Cyclist> Cyclists { get; set; }

    public DbSet<Competition> Competitions { get; set; }

    public DbSet<CompetitionCyclist> CompetitionCyclists { get; set; }

    public DbSet<CompetitionUser> CompetitionUsers { get; set; }

    public DbSet<CompetitionUserCyclist> CompetitionUserCyclists
    {
        get;
        set;
    }

    public DbSet<Stage> Stages => Set<Stage>();

    public DbSet<StageResult> StageResults => Set<StageResult>();

    public DbSet<CompetitionFinalStanding> CompetitionFinalStandings
    => Set<CompetitionFinalStanding>();

    public DbSet<CompetitionUserCyclistHistory>
    CompetitionUserCyclistHistories
        => Set<CompetitionUserCyclistHistory>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder
    )
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CompetitionCyclist>()
            .HasIndex(x => new
            {
                x.CompetitionId,
                x.CyclistId
            })
            .IsUnique();

        modelBuilder.Entity<CompetitionUser>()
            .HasIndex(x => new
            {
                x.CompetitionId,
                x.UserId
            })
            .IsUnique();

        modelBuilder.Entity<CompetitionUserCyclist>()
            .HasIndex(x => new
            {
                x.CompetitionUserId,
                x.CompetitionCyclistId
            })
            .IsUnique();

        // Eén etappe mag binnen dezelfde spelersploeg
        // maar één keer als joker gebruikt worden.
        //
        // De filter zorgt ervoor dat meerdere renners nog
        // geen joker mogen hebben zolang JokerStageId null is.
        modelBuilder.Entity<CompetitionUserCyclist>()
            .HasIndex(x => new
            {
                x.CompetitionUserId,
                x.JokerStageId
            })
            .IsUnique()
            .HasFilter("\"JokerStageId\" IS NOT NULL");

        // De jokeretappe hoort bij de selectieplaats van
        // een renner. Bij een transfer blijft deze koppeling staan.
        modelBuilder.Entity<CompetitionUserCyclist>()
            .HasOne(x => x.JokerStage)
            .WithMany()
            .HasForeignKey(x => x.JokerStageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Stage>()
            .HasIndex(x => new
            {
                x.CompetitionId,
                x.StageNumber
            })
            .IsUnique();
        
        modelBuilder.Entity<Stage>()
            .HasOne(x => x.YellowJerseyCompetitionCyclist)
            .WithMany()
            .HasForeignKey(x => x.YellowJerseyCompetitionCyclistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Stage>()
            .HasOne(x => x.GreenJerseyCompetitionCyclist)
            .WithMany()
            .HasForeignKey(x => x.GreenJerseyCompetitionCyclistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Stage>()
            .HasOne(x => x.PolkaDotJerseyCompetitionCyclist)
            .WithMany()
            .HasForeignKey(x => x.PolkaDotJerseyCompetitionCyclistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Stage>()
            .HasOne(x => x.WhiteJerseyCompetitionCyclist)
            .WithMany()
            .HasForeignKey(x => x.WhiteJerseyCompetitionCyclistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CompetitionUserCyclistHistory>()
            .HasOne(x => x.CompetitionUserCyclist)
            .WithMany()
            .HasForeignKey(x => x.CompetitionUserCyclistId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CompetitionUserCyclistHistory>()
            .HasOne(x => x.CompetitionCyclist)
            .WithMany()
            .HasForeignKey(x => x.CompetitionCyclistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StageResult>()
            .HasIndex(x => new
            {
                x.StageId,
                x.Position
            })
            .IsUnique();

        modelBuilder.Entity<StageResult>()
            .HasIndex(x => new
            {
                x.StageId,
                x.CompetitionCyclistId
            })
            .IsUnique();

        modelBuilder.Entity<CompetitionFinalStanding>()
            .HasIndex(x => new
            {
                x.CompetitionId,
                x.UserId
            })
            .IsUnique();

        modelBuilder.Entity<CompetitionFinalStanding>()
            .HasIndex(x => new
            {
                x.CompetitionId,
                x.Position
            })
            .IsUnique();

        modelBuilder.Entity<CompetitionUserCyclistHistory>()
            .HasIndex(x => new
            {
                x.CompetitionUserCyclistId,
                x.FromStageNumber
            })
            .IsUnique();
    }
}