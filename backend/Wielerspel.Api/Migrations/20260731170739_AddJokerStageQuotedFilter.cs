using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddJokerStageQuotedFilter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "JokerStageId",
                table: "CompetitionUserCyclists",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUserCyclists_CompetitionUserId_JokerStageId",
                table: "CompetitionUserCyclists",
                columns: new[] { "CompetitionUserId", "JokerStageId" },
                unique: true,
                filter: "\"JokerStageId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionUserCyclists_JokerStageId",
                table: "CompetitionUserCyclists",
                column: "JokerStageId");

            migrationBuilder.AddForeignKey(
                name: "FK_CompetitionUserCyclists_Stages_JokerStageId",
                table: "CompetitionUserCyclists",
                column: "JokerStageId",
                principalTable: "Stages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CompetitionUserCyclists_Stages_JokerStageId",
                table: "CompetitionUserCyclists");

            migrationBuilder.DropIndex(
                name: "IX_CompetitionUserCyclists_CompetitionUserId_JokerStageId",
                table: "CompetitionUserCyclists");

            migrationBuilder.DropIndex(
                name: "IX_CompetitionUserCyclists_JokerStageId",
                table: "CompetitionUserCyclists");

            migrationBuilder.DropColumn(
                name: "JokerStageId",
                table: "CompetitionUserCyclists");
        }
    }
}
