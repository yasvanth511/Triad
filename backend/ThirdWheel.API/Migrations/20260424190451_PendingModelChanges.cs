using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ThirdWheel.API.Migrations
{
    /// <inheritdoc />
    public partial class PendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusinessCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessCategories", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "BusinessCategories",
                columns: new[] { "Id", "DisplayName", "IsActive", "Key", "SortOrder" },
                values: new object[,]
                {
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a01"), "Bar / Nightclub", true, "bar-nightclub", 10 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a02"), "Restaurant / Cafe", true, "restaurant-cafe", 20 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a03"), "Fitness / Wellness", true, "fitness-wellness", 30 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a04"), "Entertainment", true, "entertainment", 40 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a05"), "Retail", true, "retail", 50 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a06"), "Events & Experiences", true, "events-experiences", 60 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a07"), "Beauty & Spa", true, "beauty-spa", 70 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a08"), "Travel & Hospitality", true, "travel-hospitality", 80 },
                    { new Guid("1d0c0a0b-3627-4f35-9208-cf0e13a89a09"), "Other", true, "other", 90 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessCategories_IsActive_SortOrder",
                table: "BusinessCategories",
                columns: new[] { "IsActive", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessCategories_Key",
                table: "BusinessCategories",
                column: "Key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessCategories");
        }
    }
}
