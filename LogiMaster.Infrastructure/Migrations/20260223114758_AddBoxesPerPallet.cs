using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogiMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBoxesPerPallet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BoxesPerPallet",
                table: "Products",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoxesPerPallet",
                table: "Products");
        }
    }
}
