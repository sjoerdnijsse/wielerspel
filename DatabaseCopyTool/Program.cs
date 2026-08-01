using Npgsql;

var sourceConnectionString =
    Environment.GetEnvironmentVariable(
        "WIELERSPEL_SOURCE_DB"
    );

var targetConnectionString =
    Environment.GetEnvironmentVariable(
        "WIELERSPEL_TARGET_DB"
    );

if (string.IsNullOrWhiteSpace(
        sourceConnectionString
    ))
{
    Console.Error.WriteLine(
        "Environment variable " +
        "WIELERSPEL_SOURCE_DB ontbreekt."
    );

    return 1;
}

if (string.IsNullOrWhiteSpace(
        targetConnectionString
    ))
{
    Console.Error.WriteLine(
        "Environment variable " +
        "WIELERSPEL_TARGET_DB ontbreekt."
    );

    return 1;
}

var tables = new[]
{
    "Teams",
    "Cyclists",
    "Competitions",
    "CompetitionCyclists",
    "Stages"
};

await using var sourceConnection =
    new NpgsqlConnection(
        sourceConnectionString
    );

await using var targetConnection =
    new NpgsqlConnection(
        targetConnectionString
    );

Console.WriteLine(
    "Verbinding maken met lokale database..."
);

await sourceConnection.OpenAsync();

Console.WriteLine(
    "Verbinding maken met Render-database..."
);

await targetConnection.OpenAsync();

Console.WriteLine();
Console.WriteLine(
    "Aantal rijen in de lokale database:"
);

foreach (var table in tables)
{
    var count = await GetRowCountAsync(
        sourceConnection,
        table
    );

    Console.WriteLine(
        $"- {table}: {count}"
    );
}

Console.WriteLine();
Console.WriteLine(
    "Aantal bestaande rijen op Render:"
);

var targetContainsData = false;

foreach (var table in tables)
{
    var count = await GetRowCountAsync(
        targetConnection,
        table
    );

    Console.WriteLine(
        $"- {table}: {count}"
    );

    if (count > 0)
    {
        targetContainsData = true;
    }
}

if (targetContainsData)
{
    Console.Error.WriteLine();
    Console.Error.WriteLine(
        "Gestopt: minimaal één doeltabel bevat " +
        "al gegevens."
    );

    Console.Error.WriteLine(
        "De tool verwijdert of overschrijft nooit " +
        "automatisch bestaande productiegegevens."
    );

    return 1;
}

Console.WriteLine();
Console.WriteLine(
    "De volgende tabellen worden gekopieerd:"
);

foreach (var table in tables)
{
    Console.WriteLine($"- {table}");
}

Console.WriteLine();
Console.Write(
    "Typ KOPIEREN om door te gaan: "
);

var confirmation = Console.ReadLine();

if (!string.Equals(
        confirmation,
        "KOPIEREN",
        StringComparison.Ordinal
    ))
{
    Console.WriteLine(
        "Kopiëren geannuleerd."
    );

    return 0;
}

await using var transaction =
    await targetConnection.BeginTransactionAsync();

try
{
    foreach (var table in tables)
    {
        var copiedCount =
            await CopyTableAsync(
                sourceConnection,
                targetConnection,
                transaction,
                table
            );

        Console.WriteLine(
            $"{table}: {copiedCount} rijen gekopieerd."
        );
    }

    await transaction.CommitAsync();

    Console.WriteLine();
    Console.WriteLine(
        "Alle stamgegevens zijn succesvol " +
        "naar Render gekopieerd."
    );

    return 0;
}
catch (Exception exception)
{
    await transaction.RollbackAsync();

    Console.Error.WriteLine();
    Console.Error.WriteLine(
        "Het kopiëren is mislukt. " +
        "Alle wijzigingen zijn teruggedraaid."
    );

    Console.Error.WriteLine(
        exception.Message
    );

    return 1;
}

static async Task<long> GetRowCountAsync(
    NpgsqlConnection connection,
    string table
)
{
    var sql =
        $"""
        SELECT COUNT(*)
        FROM public.{QuoteIdentifier(table)};
        """;

    await using var command =
        new NpgsqlCommand(sql, connection);

    var result =
        await command.ExecuteScalarAsync();

    return Convert.ToInt64(result);
}

static async Task<int> CopyTableAsync(
    NpgsqlConnection sourceConnection,
    NpgsqlConnection targetConnection,
    NpgsqlTransaction targetTransaction,
    string table
)
{
    var columns =
        await GetColumnsAsync(
            sourceConnection,
            table
        );

    if (columns.Count == 0)
    {
        throw new InvalidOperationException(
            $"Geen kolommen gevonden voor {table}."
        );
    }

    var quotedColumns =
        string.Join(
            ", ",
            columns.Select(QuoteIdentifier)
        );

    var parameterNames =
        string.Join(
            ", ",
            columns.Select(
                (_, index) => $"@value{index}"
            )
        );

    var selectSql =
        $"""
        SELECT {quotedColumns}
        FROM public.{QuoteIdentifier(table)};
        """;

    var insertSql =
        $"""
        INSERT INTO public.{QuoteIdentifier(table)}
        ({quotedColumns})
        VALUES ({parameterNames});
        """;

    await using var selectCommand =
        new NpgsqlCommand(
            selectSql,
            sourceConnection
        );

    await using var reader =
        await selectCommand.ExecuteReaderAsync();

    var copiedCount = 0;

    while (await reader.ReadAsync())
    {
        await using var insertCommand =
            new NpgsqlCommand(
                insertSql,
                targetConnection,
                targetTransaction
            );

        for (
            var index = 0;
            index < columns.Count;
            index++
        )
        {
            var value =
                await reader.IsDBNullAsync(index)
                    ? DBNull.Value
                    : reader.GetValue(index);

            insertCommand.Parameters.AddWithValue(
                $"value{index}",
                value
            );
        }

        await insertCommand.ExecuteNonQueryAsync();

        copiedCount++;
    }

    return copiedCount;
}

static async Task<List<string>> GetColumnsAsync(
    NpgsqlConnection connection,
    string table
)
{
    const string sql =
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = @table
          AND is_generated = 'NEVER'
          AND identity_generation IS NULL
        ORDER BY ordinal_position;
        """;

    await using var command =
        new NpgsqlCommand(sql, connection);

    command.Parameters.AddWithValue(
        "table",
        table
    );

    await using var reader =
        await command.ExecuteReaderAsync();

    var columns = new List<string>();

    while (await reader.ReadAsync())
    {
        columns.Add(
            reader.GetString(0)
        );
    }

    return columns;
}

static string QuoteIdentifier(
    string identifier
)
{
    return "\"" +
        identifier.Replace("\"", "\"\"") +
        "\"";
}