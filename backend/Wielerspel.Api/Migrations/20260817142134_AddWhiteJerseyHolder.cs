using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWhiteJerseyHolder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<Guid>(
                name: "WhiteJerseyCompetitionCyclistId",
                table: "Stages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stages_WhiteJerseyCompetitionCyclistId",
                table: "Stages",
                column: "WhiteJerseyCompetitionCyclistId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stages_CompetitionCyclists_GreenJerseyCompetitionCyclistId",
                table: "Stages",
                column: "GreenJerseyCompetitionCyclistId",
                principalTable: "CompetitionCyclists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Stages_CompetitionCyclists_PolkaDotJerseyCompetitionCyclist~",
                table: "Stages",
                column: "PolkaDotJerseyCompetitionCyclistId",
                principalTable: "CompetitionCyclists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Stages_CompetitionCyclists_WhiteJerseyCompetitionCyclistId",
                table: "Stages",
                column: "WhiteJerseyCompetitionCyclistId",
                principalTable: "CompetitionCyclists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Stages_CompetitionCyclists_YellowJerseyCompetitionCyclistId",
                table: "Stages",
                column: "YellowJerseyCompetitionCyclistId",
                principalTable: "CompetitionCyclists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
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
                name: "FK_Stages_CompetitionCyclists_WhiteJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropForeignKey(
                name: "FK_Stages_CompetitionCyclists_YellowJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropIndex(
                name: "IX_Stages_WhiteJerseyCompetitionCyclistId",
                table: "Stages");

            migrationBuilder.DropColumn(
                name: "WhiteJerseyCompetitionCyclistId",
                table: "Stages");

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
    }
}
