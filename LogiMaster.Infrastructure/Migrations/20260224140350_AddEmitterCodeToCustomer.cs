using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogiMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmitterCodeToCustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmitterCode",
                table: "Customers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmitterCode",
                table: "Customers");
        }
    }
}
