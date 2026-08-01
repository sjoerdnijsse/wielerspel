using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Stages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageNumber = table.Column<int>(type: "integer", nullable: false),
                    StartLocation = table.Column<string>(type: "text", nullable: false),
                    FinishLocation = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ResultsPublished = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stages_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StageResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StageId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionCyclistId = table.Column<Guid>(type: "uuid", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StageResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StageResults_CompetitionCyclists_CompetitionCyclistId",
                        column: x => x.CompetitionCyclistId,
                        principalTable: "CompetitionCyclists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StageResults_Stages_StageId",
                        column: x => x.StageId,
                        principalTable: "Stages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StageResults_CompetitionCyclistId",
                table: "StageResults",
                column: "CompetitionCyclistId");

            migrationBuilder.CreateIndex(
                name: "IX_StageResults_StageId_CompetitionCyclistId",
                table: "StageResults",
                columns: new[] { "StageId", "CompetitionCyclistId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StageResults_StageId_Position",
                table: "StageResults",
                columns: new[] { "StageId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stages_CompetitionId_StageNumber",
                table: "Stages",
                columns: new[] { "CompetitionId", "StageNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StageResults");

            migrationBuilder.DropTable(
                name: "Stages");
        }
    }
}
