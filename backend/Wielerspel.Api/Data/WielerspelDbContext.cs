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

    public DbSet<CompetitionUserCyclist> CompetitionUserCyclists { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
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
    }
}