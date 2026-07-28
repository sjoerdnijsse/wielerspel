using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class MoveCyclistNumberToCompetitionCyclist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Number",
                table: "Cyclists");

            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "CompetitionCyclists",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Number",
                table: "CompetitionCyclists");

            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "Cyclists",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
