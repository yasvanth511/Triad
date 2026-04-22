using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ThirdWheel.API.Data;

#nullable disable

namespace ThirdWheel.API.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260422201000_UseDefaultProfilePhotos")]
public partial class UseDefaultProfilePhotos : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "Url",
            table: "UserPhotos",
            type: "text",
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(500)",
            oldMaxLength: 500);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "Url",
            table: "UserPhotos",
            type: "character varying(500)",
            maxLength: 500,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "text");
    }
}
