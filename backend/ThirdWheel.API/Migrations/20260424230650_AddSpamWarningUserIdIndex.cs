using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ThirdWheel.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSpamWarningUserIdIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SpamWarnings_UserId",
                table: "SpamWarnings");

            migrationBuilder.CreateIndex(
                name: "IX_SpamWarnings_UserId_CreatedAt",
                table: "SpamWarnings",
                columns: new[] { "UserId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SpamWarnings_UserId_CreatedAt",
                table: "SpamWarnings");

            migrationBuilder.CreateIndex(
                name: "IX_SpamWarnings_UserId",
                table: "SpamWarnings",
                column: "UserId");
        }
    }
}
