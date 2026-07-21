using Microsoft.EntityFrameworkCore;
using Wielerspel.Api.Models;

namespace Wielerspel.Api.Data;

public class WielerspelDbContext : DbContext
{
    public WielerspelDbContext(DbContextOptions<WielerspelDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
}