using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ThirdWheel.API.Migrations
{
    /// <inheritdoc />
    public partial class AddImpressMe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ImpressMeSignals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceiverId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    Flow = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImpressMeSignals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImpressMeSignals_Users_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ImpressMeSignals_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImpressMePrompts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SignalId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PromptText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SenderContext = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImpressMePrompts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImpressMePrompts_ImpressMeSignals_SignalId",
                        column: x => x.SignalId,
                        principalTable: "ImpressMeSignals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImpressMeResponses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SignalId = table.Column<Guid>(type: "uuid", nullable: false),
                    TextContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    MediaUrl = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    MediaType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImpressMeResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImpressMeResponses_ImpressMeSignals_SignalId",
                        column: x => x.SignalId,
                        principalTable: "ImpressMeSignals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImpressMePrompts_SignalId",
                table: "ImpressMePrompts",
                column: "SignalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImpressMeResponses_SignalId",
                table: "ImpressMeResponses",
                column: "SignalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImpressMeSignals_ExpiresAt",
                table: "ImpressMeSignals",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ImpressMeSignals_ReceiverId_CreatedAt",
                table: "ImpressMeSignals",
                columns: new[] { "ReceiverId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ImpressMeSignals_SenderId_CreatedAt",
                table: "ImpressMeSignals",
                columns: new[] { "SenderId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ImpressMeSignals_SenderId_ReceiverId_Status",
                table: "ImpressMeSignals",
                columns: new[] { "SenderId", "ReceiverId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImpressMePrompts");

            migrationBuilder.DropTable(
                name: "ImpressMeResponses");

            migrationBuilder.DropTable(
                name: "ImpressMeSignals");
        }
    }
}
