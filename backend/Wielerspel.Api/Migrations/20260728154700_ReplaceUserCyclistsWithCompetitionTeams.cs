using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceUserCyclistsWithCompetitionTeams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserCyclists");

            migrationBuilder.CreateTable(
                name: "CompetitionUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransfersUsed = table.Column<int>(type: "integer", nullable: false),
                    TeamLocked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetitionUsers_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionUsers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompetitionUserCyclists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetitionCyclistId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionUserCyclists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompetitionUserCyclists_CompetitionCyclists_CompetitionCycl~",
                        column: x => x.CompetitionCyclistId,
                        principalTable: "CompetitionCyclists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionUserCyclists_CompetitionUsers_CompetitionUserId",
                        column: x => x.CompetitionUserId,
                        principalTable: "CompetitionUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUserCyclists_CompetitionCyclistId",
                table: "CompetitionUserCyclists",
                column: "CompetitionCyclistId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUserCyclists_CompetitionUserId_CompetitionCyclis~",
                table: "CompetitionUserCyclists",
                columns: new[] { "CompetitionUserId", "CompetitionCyclistId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUsers_CompetitionId_UserId",
                table: "CompetitionUsers",
                columns: new[] { "CompetitionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUsers_UserId",
                table: "CompetitionUsers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompetitionUserCyclists");

            migrationBuilder.DropTable(
                name: "CompetitionUsers");

            migrationBuilder.CreateTable(
                name: "UserCyclists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CyclistId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCyclists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCyclists_Cyclists_CyclistId",
                        column: x => x.CyclistId,
                        principalTable: "Cyclists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCyclists_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserCyclists_CyclistId",
                table: "UserCyclists",
                column: "CyclistId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCyclists_UserId",
                table: "UserCyclists",
                column: "UserId");
        }
    }
}
