using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ThirdWheel.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessPartnerFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "BusinessAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<int>(type: "integer", nullable: false),
                    AdminUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetPartnerId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetEventId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetOfferId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetChallengeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Note = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BusinessPartners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessPartners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessPartners_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessPartnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Location = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: true),
                    Price = table.Column<decimal>(type: "numeric", nullable: true),
                    ExternalTicketUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessEvents_BusinessPartners_BusinessPartnerId",
                        column: x => x.BusinessPartnerId,
                        principalTable: "BusinessPartners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessPartnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessProfiles_BusinessPartners_BusinessPartnerId",
                        column: x => x.BusinessPartnerId,
                        principalTable: "BusinessPartners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessEventImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessEventImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessEventImages_BusinessEvents_BusinessEventId",
                        column: x => x.BusinessEventId,
                        principalTable: "BusinessEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessOffers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    OfferType = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CouponCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ClaimLimit = table.Column<int>(type: "integer", nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RedemptionInstructions = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessOffers_BusinessEvents_BusinessEventId",
                        column: x => x.BusinessEventId,
                        principalTable: "BusinessEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventChallenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    Prompt = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RewardType = table.Column<int>(type: "integer", nullable: false),
                    RewardDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MaxWinners = table.Column<int>(type: "integer", nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventChallenges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventChallenges_BusinessEvents_BusinessEventId",
                        column: x => x.BusinessEventId,
                        principalTable: "BusinessEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventLikes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventLikes_BusinessEvents_BusinessEventId",
                        column: x => x.BusinessEventId,
                        principalTable: "BusinessEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventRegistrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventRegistrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventRegistrations_BusinessEvents_BusinessEventId",
                        column: x => x.BusinessEventId,
                        principalTable: "BusinessEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventRegistrations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventSaves",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSaves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSaves_BusinessEvents_BusinessEventId",
                        column: x => x.BusinessEventId,
                        principalTable: "BusinessEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventSaves_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CouponClaims",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessOfferId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRedeemed = table.Column<bool>(type: "boolean", nullable: false),
                    RedeemedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CouponClaims_BusinessOffers_BusinessOfferId",
                        column: x => x.BusinessOfferId,
                        principalTable: "BusinessOffers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CouponClaims_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChallengeResponses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventChallengeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResponseText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChallengeResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChallengeResponses_EventChallenges_EventChallengeId",
                        column: x => x.EventChallengeId,
                        principalTable: "EventChallenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChallengeResponses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RewardClaims",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventChallengeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChallengeResponseId = table.Column<Guid>(type: "uuid", nullable: false),
                    RewardCode = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RewardNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RewardClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RewardClaims_ChallengeResponses_ChallengeResponseId",
                        column: x => x.ChallengeResponseId,
                        principalTable: "ChallengeResponses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RewardClaims_EventChallenges_EventChallengeId",
                        column: x => x.EventChallengeId,
                        principalTable: "EventChallenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RewardClaims_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessAuditLogs_CreatedAt",
                table: "BusinessAuditLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessAuditLogs_TargetEventId",
                table: "BusinessAuditLogs",
                column: "TargetEventId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessAuditLogs_TargetPartnerId",
                table: "BusinessAuditLogs",
                column: "TargetPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessEventImages_BusinessEventId",
                table: "BusinessEventImages",
                column: "BusinessEventId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessEvents_BusinessPartnerId",
                table: "BusinessEvents",
                column: "BusinessPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessEvents_StartDate",
                table: "BusinessEvents",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessEvents_Status",
                table: "BusinessEvents",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessOffers_BusinessEventId",
                table: "BusinessOffers",
                column: "BusinessEventId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessOffers_Status",
                table: "BusinessOffers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessPartners_Status",
                table: "BusinessPartners",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessPartners_UserId",
                table: "BusinessPartners",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BusinessProfiles_BusinessPartnerId",
                table: "BusinessProfiles",
                column: "BusinessPartnerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChallengeResponses_EventChallengeId_Status",
                table: "ChallengeResponses",
                columns: new[] { "EventChallengeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ChallengeResponses_UserId_EventChallengeId",
                table: "ChallengeResponses",
                columns: new[] { "UserId", "EventChallengeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CouponClaims_BusinessOfferId",
                table: "CouponClaims",
                column: "BusinessOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponClaims_UserId_BusinessOfferId",
                table: "CouponClaims",
                columns: new[] { "UserId", "BusinessOfferId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventChallenges_BusinessEventId",
                table: "EventChallenges",
                column: "BusinessEventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventLikes_BusinessEventId",
                table: "EventLikes",
                column: "BusinessEventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventLikes_UserId_BusinessEventId",
                table: "EventLikes",
                columns: new[] { "UserId", "BusinessEventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventRegistrations_BusinessEventId",
                table: "EventRegistrations",
                column: "BusinessEventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventRegistrations_UserId_BusinessEventId",
                table: "EventRegistrations",
                columns: new[] { "UserId", "BusinessEventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventSaves_BusinessEventId",
                table: "EventSaves",
                column: "BusinessEventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSaves_UserId_BusinessEventId",
                table: "EventSaves",
                columns: new[] { "UserId", "BusinessEventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RewardClaims_ChallengeResponseId",
                table: "RewardClaims",
                column: "ChallengeResponseId");

            migrationBuilder.CreateIndex(
                name: "IX_RewardClaims_EventChallengeId",
                table: "RewardClaims",
                column: "EventChallengeId");

            migrationBuilder.CreateIndex(
                name: "IX_RewardClaims_UserId_EventChallengeId",
                table: "RewardClaims",
                columns: new[] { "UserId", "EventChallengeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessAuditLogs");

            migrationBuilder.DropTable(
                name: "BusinessEventImages");

            migrationBuilder.DropTable(
                name: "BusinessProfiles");

            migrationBuilder.DropTable(
                name: "CouponClaims");

            migrationBuilder.DropTable(
                name: "EventLikes");

            migrationBuilder.DropTable(
                name: "EventRegistrations");

            migrationBuilder.DropTable(
                name: "EventSaves");

            migrationBuilder.DropTable(
                name: "RewardClaims");

            migrationBuilder.DropTable(
                name: "BusinessOffers");

            migrationBuilder.DropTable(
                name: "ChallengeResponses");

            migrationBuilder.DropTable(
                name: "EventChallenges");

            migrationBuilder.DropTable(
                name: "BusinessEvents");

            migrationBuilder.DropTable(
                name: "BusinessPartners");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
