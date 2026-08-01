using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStageJerseyHolders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GreenJerseyCompetitionCyclistId",
                table: "Stages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PolkaDotJerseyCompetitionCyclistId",
                table: "Stages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "YellowJerseyCompetitionCyclistId",
                table: "Stages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stages_GreenJerseyCompetitionCyclistId",
                table: "Stages",
                column: "GreenJerseyCompetitionCyclistId");

            migrationBuilder.CreateIndex(
                name: "IX_Stages_PolkaDotJerseyCompetitionCyclistId",
                table: "Stages",
                column: "PolkaDotJerseyCompetitionCyclistId");

            migrationBuilder.CreateIndex(
                name: "IX_Stages_YellowJerseyCompetitionCyclistId",
                table: "Stages",
                column: "YellowJerseyCompetitionCyclistId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stages_CompetitionCyclists_GreenJerseyCompetitionCyclistId",
                table: "Stages",
                column: "GreenJerseyCompetitionCyclistId",
                principalTable: "CompetitionCyclists",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Stages_CompetitionCyclists_PolkaDotJerseyCompetitionCyclist~",
                table: "Stages",
                column: "PolkaDotJerseyCompetitionCyclistId",
                principalTable: "CompetitionCyclists",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Stages_CompetitionCyclists_YellowJerseyCompetitionCyclistId",
                table: "Stages",
                column: "YellowJerseyCompetitionCyclistId",
                principalTable: "CompetitionCyclists",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stages_CompetitionCyclists_GreenJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropForeignKey(
                name: "FK_Stages_CompetitionCyclists_PolkaDotJerseyCompetitionCyclist~",
                table: "Stages");

            migrationBuilder.DropForeignKey(
                name: "FK_Stages_CompetitionCyclists_YellowJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropIndex(
                name: "IX_Stages_GreenJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropIndex(
                name: "IX_Stages_PolkaDotJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropIndex(
                name: "IX_Stages_YellowJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropColumn(
                name: "GreenJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropColumn(
                name: "PolkaDotJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropColumn(
                name: "YellowJerseyCompetitionCyclistId",
                table: "Stages");
        }
    }
}
