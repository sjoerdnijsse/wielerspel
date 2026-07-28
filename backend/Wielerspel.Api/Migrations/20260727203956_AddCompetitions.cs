using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompetitions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "Cyclists");

            migrationBuilder.CreateTable(
                name: "Competitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    TeamSize = table.Column<int>(type: "integer", nullable: false),
                    Budget = table.Column<int>(type: "integer", nullable: false),
                    MaxTransfers = table.Column<int>(type: "integer", nullable: false),
                    TeamLockDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Competitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CompetitionCyclists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CyclistId = table.Column<Guid>(type: "uuid", nullable: false),
                    Price = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionCyclists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetitionCyclists_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionCyclists_Cyclists_CyclistId",
                        column: x => x.CyclistId,
                        principalTable: "Cyclists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionCyclists_CompetitionId_CyclistId",
                table: "CompetitionCyclists",
                columns: new[] { "CompetitionId", "CyclistId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionCyclists_CyclistId",
                table: "CompetitionCyclists",
                column: "CyclistId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompetitionCyclists");

            migrationBuilder.DropTable(
                name: "Competitions");

            migrationBuilder.AddColumn<int>(
                name: "Price",
                table: "Cyclists",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
