using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ThirdWheel.API.Data;

#nullable disable

namespace ThirdWheel.API.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260423000100_AddPerformanceIndexes")]
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Events_EventDate",
                table: "Events",
                column: "EventDate");

            migrationBuilder.CreateIndex(
                name: "IX_Likes_FromUserId_CreatedAt",
                table: "Likes",
                columns: new[] { "FromUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_Couple1Id_CreatedAt",
                table: "Matches",
                columns: new[] { "Couple1Id", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_Couple2Id_CreatedAt",
                table: "Matches",
                columns: new[] { "Couple2Id", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_User1Id_CreatedAt",
                table: "Matches",
                columns: new[] { "User1Id", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_User2Id_CreatedAt",
                table: "Matches",
                columns: new[] { "User2Id", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_MatchId_SentAt",
                table: "Messages",
                columns: new[] { "MatchId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_SenderId_SentAt",
                table: "Messages",
                columns: new[] { "SenderId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SavedProfiles_UserId_CreatedAt",
                table: "SavedProfiles",
                columns: new[] { "UserId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Events_EventDate",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Likes_FromUserId_CreatedAt",
                table: "Likes");

            migrationBuilder.DropIndex(
                name: "IX_Matches_Couple1Id_CreatedAt",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_Couple2Id_CreatedAt",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_User1Id_CreatedAt",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_User2Id_CreatedAt",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Messages_MatchId_SentAt",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_SenderId_SentAt",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_SavedProfiles_UserId_CreatedAt",
                table: "SavedProfiles");
        }
    }
}