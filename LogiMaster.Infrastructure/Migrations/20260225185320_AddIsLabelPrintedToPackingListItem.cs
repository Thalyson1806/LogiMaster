using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogiMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsLabelPrintedToPackingListItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsLabelPrinted",
                table: "PackingListItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LabelPrintedAt",
                table: "PackingListItems",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsLabelPrinted",
                table: "PackingListItems");

            migrationBuilder.DropColumn(
                name: "LabelPrintedAt",
                table: "PackingListItems");
        }
    }
}
