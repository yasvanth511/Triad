using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ThirdWheel.API.Migrations
{
    /// <inheritdoc />
    public partial class RenameBodyCountToComfortWithIntimacy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BodyCount",
                table: "Users",
                newName: "ComfortWithIntimacy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ComfortWithIntimacy",
                table: "Users",
                newName: "BodyCount");
        }
    }
}
