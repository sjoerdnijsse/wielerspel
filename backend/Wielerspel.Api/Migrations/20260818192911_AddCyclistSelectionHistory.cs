using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCyclistSelectionHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CompetitionUserCyclistHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionUserCyclistId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionCyclistId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStageNumber = table.Column<int>(type: "integer", nullable: false),
                    ToStageNumber = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionUserCyclistHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetitionUserCyclistHistories_CompetitionCyclists_Competi~",
                        column: x => x.CompetitionCyclistId,
                        principalTable: "CompetitionCyclists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CompetitionUserCyclistHistories_CompetitionUserCyclists_Com~",
                        column: x => x.CompetitionUserCyclistId,
                        principalTable: "CompetitionUserCyclists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUserCyclistHistories_CompetitionCyclistId",
                table: "CompetitionUserCyclistHistories",
                column: "CompetitionCyclistId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUserCyclistHistories_CompetitionUserCyclistId_Fr~",
                table: "CompetitionUserCyclistHistories",
                columns: new[] { "CompetitionUserCyclistId", "FromStageNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompetitionUserCyclistHistories");
        }
    }
}
