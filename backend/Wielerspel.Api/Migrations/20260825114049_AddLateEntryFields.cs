using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wielerspel.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLateEntryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InitialTeamFromStageNumber",
                table: "CompetitionUsers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLateEntry",
                table: "CompetitionUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InitialTeamFromStageNumber",
                table: "CompetitionUsers");

            migrationBuilder.DropColumn(
                name: "IsLateEntry",
                table: "CompetitionUsers");
        }
    }
}
