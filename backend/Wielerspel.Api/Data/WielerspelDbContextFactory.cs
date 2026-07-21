using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Wielerspel.Api.Data;

public class WielerspelDbContextFactory 
    : IDesignTimeDbContextFactory<WielerspelDbContext>
{
    public WielerspelDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<WielerspelDbContext>();

        optionsBuilder.UseNpgsql(
            "Host=localhost;Database=wielerspel;Username=postgres;Password=$joerD85"
        );

        return new WielerspelDbContext(optionsBuilder.Options);
    }
}