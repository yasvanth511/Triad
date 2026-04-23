using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ThirdWheel.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVerificationFramework : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserVerifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MethodKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MethodVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    FailureReason = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastAttemptId = table.Column<Guid>(type: "uuid", nullable: true),
                    StateJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserVerifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VerificationAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    VerificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    MethodKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MethodVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ProviderReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    RequestJson = table.Column<string>(type: "text", nullable: true),
                    ResultJson = table.Column<string>(type: "text", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationAttempts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VerificationEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    VerificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    AttemptId = table.Column<Guid>(type: "uuid", nullable: true),
                    MethodKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EventType = table.Column<int>(type: "integer", nullable: false),
                    FromStatus = table.Column<int>(type: "integer", nullable: true),
                    ToStatus = table.Column<int>(type: "integer", nullable: true),
                    Message = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    DataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationEvents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserVerifications_UserId_MethodKey",
                table: "UserVerifications",
                columns: new[] { "UserId", "MethodKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserVerifications_UserId_Status",
                table: "UserVerifications",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_VerificationAttempts_UserId_MethodKey_IdempotencyKey",
                table: "VerificationAttempts",
                columns: new[] { "UserId", "MethodKey", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationAttempts_UserId_MethodKey_StartedAt",
                table: "VerificationAttempts",
                columns: new[] { "UserId", "MethodKey", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_VerificationAttempts_VerificationId_StartedAt",
                table: "VerificationAttempts",
                columns: new[] { "VerificationId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_VerificationEvents_UserId_MethodKey_CreatedAt",
                table: "VerificationEvents",
                columns: new[] { "UserId", "MethodKey", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_VerificationEvents_VerificationId_CreatedAt",
                table: "VerificationEvents",
                columns: new[] { "VerificationId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserVerifications");

            migrationBuilder.DropTable(
                name: "VerificationAttempts");

            migrationBuilder.DropTable(
                name: "VerificationEvents");
        }
    }
}
