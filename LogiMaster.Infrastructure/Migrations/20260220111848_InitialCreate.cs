using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LogiMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CompanyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TaxId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    ZipCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    GeocodedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PackagingTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackagingTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Department = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastAccessAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WarehouseStreets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    RackCount = table.Column<int>(type: "integer", nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarehouseStreets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EdiClients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EdiCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    SpreadsheetConfigJson = table.Column<string>(type: "text", nullable: false),
                    DeliveryRulesJson = table.Column<string>(type: "text", nullable: false),
                    FileType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EdiClients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EdiClients_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EdifactFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MessageType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    TotalSegments = table.Column<int>(type: "integer", nullable: false),
                    TotalItemsProcessed = table.Column<int>(type: "integer", nullable: false),
                    TotalItemsWithError = table.Column<int>(type: "integer", nullable: false),
                    RawContent = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EdifactFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EdifactFiles_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Packagings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    PackagingTypeId = table.Column<int>(type: "integer", nullable: false),
                    Length = table.Column<decimal>(type: "numeric", nullable: true),
                    Width = table.Column<decimal>(type: "numeric", nullable: true),
                    Height = table.Column<decimal>(type: "numeric", nullable: true),
                    Weight = table.Column<decimal>(type: "numeric", nullable: true),
                    MaxWeight = table.Column<decimal>(type: "numeric", nullable: true),
                    MaxUnits = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Packagings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Packagings_PackagingTypes_PackagingTypeId",
                        column: x => x.PackagingTypeId,
                        principalTable: "PackagingTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BillingRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ImportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalItems = table.Column<int>(type: "integer", nullable: false),
                    TotalCustomers = table.Column<int>(type: "integer", nullable: false),
                    TotalValue = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalQuantity = table.Column<int>(type: "integer", nullable: false),
                    ImportedById = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsProcessed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingRequests_Users_ImportedById",
                        column: x => x.ImportedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "WarehouseLocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StreetId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Street = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Rack = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    Position = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarehouseLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WarehouseLocations_WarehouseStreets_StreetId",
                        column: x => x.StreetId,
                        principalTable: "WarehouseStreets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EdiRoutes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EdiClientId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RouteType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DaysOfWeekJson = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FrequencyPerWeek = table.Column<int>(type: "integer", nullable: true),
                    FrequencyDays = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EdiRoutes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EdiRoutes_EdiClients_EdiClientId",
                        column: x => x.EdiClientId,
                        principalTable: "EdiClients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Reference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    UnitsPerBox = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    UnitWeight = table.Column<decimal>(type: "numeric", nullable: true),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    Barcode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DefaultPackagingId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Packagings_DefaultPackagingId",
                        column: x => x.DefaultPackagingId,
                        principalTable: "Packagings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PackingLists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    BillingRequestId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SeparatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConferencedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InvoicedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedById = table.Column<int>(type: "integer", nullable: true),
                    SeparatedById = table.Column<int>(type: "integer", nullable: true),
                    ConferencedById = table.Column<int>(type: "integer", nullable: true),
                    InvoicedById = table.Column<int>(type: "integer", nullable: true),
                    TotalVolumes = table.Column<int>(type: "integer", nullable: false),
                    TotalWeight = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalValue = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalItems = table.Column<int>(type: "integer", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InvoiceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DriverName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DeliverySignaturePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DeliveryLatitude = table.Column<double>(type: "double precision", nullable: true),
                    DeliveryLongitude = table.Column<double>(type: "double precision", nullable: true),
                    InvoicePdfPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CanhotoPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackingLists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackingLists_BillingRequests_BillingRequestId",
                        column: x => x.BillingRequestId,
                        principalTable: "BillingRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PackingLists_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PackingLists_Users_ConferencedById",
                        column: x => x.ConferencedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PackingLists_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PackingLists_Users_InvoicedById",
                        column: x => x.InvoicedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PackingLists_Users_SeparatedById",
                        column: x => x.SeparatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EdiConversions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EdiClientId = table.Column<int>(type: "integer", nullable: false),
                    EdiRouteId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ConvertedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConvertedById = table.Column<int>(type: "integer", nullable: true),
                    InputFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OutputFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalProductsProcessed = table.Column<int>(type: "integer", nullable: false),
                    TotalLinesGenerated = table.Column<int>(type: "integer", nullable: false),
                    ProductsNotFound = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EdiConversions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EdiConversions_EdiClients_EdiClientId",
                        column: x => x.EdiClientId,
                        principalTable: "EdiClients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EdiConversions_EdiRoutes_EdiRouteId",
                        column: x => x.EdiRouteId,
                        principalTable: "EdiRoutes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EdiConversions_Users_ConvertedById",
                        column: x => x.ConvertedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BillingRequestItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BillingRequestId = table.Column<int>(type: "integer", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    ProductId = table.Column<int>(type: "integer", nullable: true),
                    CustomerCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ProductReference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ProductDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    PendingQuantity = table.Column<int>(type: "integer", nullable: false),
                    ProcessedQuantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalValue = table.Column<decimal>(type: "numeric", nullable: false),
                    IsCustomerTotal = table.Column<bool>(type: "boolean", nullable: false),
                    ExpectedDeliveryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingRequestItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingRequestItems_BillingRequests_BillingRequestId",
                        column: x => x.BillingRequestId,
                        principalTable: "BillingRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BillingRequestItems_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BillingRequestItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CustomerProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    CustomerCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerProducts_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EdifactItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EdifactFileId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: true),
                    ItemCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BuyerItemCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SupplierItemCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DeliveryStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveryEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveryLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DocumentNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LineNumber = table.Column<int>(type: "integer", nullable: false),
                    IsProcessed = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    BillingRequestItemId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EdifactItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EdifactItems_EdifactFiles_EdifactFileId",
                        column: x => x.EdifactFileId,
                        principalTable: "EdifactFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EdifactItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EdiProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EdiClientId = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ProductId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EdiProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EdiProducts_EdiClients_EdiClientId",
                        column: x => x.EdiClientId,
                        principalTable: "EdiClients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EdiProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProductLocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    LocationId = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductLocations_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductLocations_WarehouseLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "WarehouseLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PackingListItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PackingListId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    BillingRequestItemId = table.Column<int>(type: "integer", nullable: true),
                    Reference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Edi = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitsPerBox = table.Column<int>(type: "integer", nullable: false),
                    Volumes = table.Column<int>(type: "integer", nullable: false),
                    Batch = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalValue = table.Column<decimal>(type: "numeric", nullable: false),
                    UnitWeight = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalWeight = table.Column<decimal>(type: "numeric", nullable: false),
                    IsConferenced = table.Column<bool>(type: "boolean", nullable: false),
                    ConferencedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackingListItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackingListItems_BillingRequestItems_BillingRequestItemId",
                        column: x => x.BillingRequestItemId,
                        principalTable: "BillingRequestItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PackingListItems_PackingLists_PackingListId",
                        column: x => x.PackingListId,
                        principalTable: "PackingLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PackingListItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "PackagingTypes",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "CAIXA", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Caixa de papelão ou plástico", true, "Caixa", null },
                    { 2, "PALETE", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Palete de madeira ou plástico", true, "Palete", null },
                    { 3, "SACOLA", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sacola plástica", true, "Sacola", null },
                    { 4, "ENGRADADO", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Engradado de plástico ou madeira", true, "Engradado", null },
                    { 5, "TAMBOR", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tambor metálico ou plástico", true, "Tambor", null },
                    { 6, "OUTRO", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Outro tipo de embalagem", true, "Outro", null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Department", "Email", "IsActive", "LastAccessAt", "Name", "PasswordHash", "Role", "UpdatedAt" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "T.I", "admin@logimaster.com", true, null, "Administrator", "admin123", 0, null });

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequestItems_BillingRequestId",
                table: "BillingRequestItems",
                column: "BillingRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequestItems_CustomerId",
                table: "BillingRequestItems",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequestItems_PendingQuantity",
                table: "BillingRequestItems",
                column: "PendingQuantity");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequestItems_ProductId",
                table: "BillingRequestItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequests_Code",
                table: "BillingRequests",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequests_ImportedAt",
                table: "BillingRequests",
                column: "ImportedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequests_ImportedById",
                table: "BillingRequests",
                column: "ImportedById");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRequests_IsProcessed",
                table: "BillingRequests",
                column: "IsProcessed");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProducts_CustomerCode",
                table: "CustomerProducts",
                column: "CustomerCode");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProducts_CustomerId_ProductId",
                table: "CustomerProducts",
                columns: new[] { "CustomerId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProducts_IsActive",
                table: "CustomerProducts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProducts_ProductId",
                table: "CustomerProducts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Code",
                table: "Customers",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_IsActive",
                table: "Customers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Name",
                table: "Customers",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_EdiClients_Code",
                table: "EdiClients",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EdiClients_CustomerId",
                table: "EdiClients",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_EdiClients_EdiCode",
                table: "EdiClients",
                column: "EdiCode");

            migrationBuilder.CreateIndex(
                name: "IX_EdiClients_IsActive",
                table: "EdiClients",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_EdiConversions_Code",
                table: "EdiConversions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EdiConversions_ConvertedAt",
                table: "EdiConversions",
                column: "ConvertedAt");

            migrationBuilder.CreateIndex(
                name: "IX_EdiConversions_ConvertedById",
                table: "EdiConversions",
                column: "ConvertedById");

            migrationBuilder.CreateIndex(
                name: "IX_EdiConversions_EdiClientId",
                table: "EdiConversions",
                column: "EdiClientId");

            migrationBuilder.CreateIndex(
                name: "IX_EdiConversions_EdiRouteId",
                table: "EdiConversions",
                column: "EdiRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_EdiConversions_Status",
                table: "EdiConversions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EdifactFiles_CustomerId",
                table: "EdifactFiles",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_EdifactFiles_CustomerId_Status",
                table: "EdifactFiles",
                columns: new[] { "CustomerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_EdifactFiles_ReceivedAt",
                table: "EdifactFiles",
                column: "ReceivedAt");

            migrationBuilder.CreateIndex(
                name: "IX_EdifactFiles_Status",
                table: "EdifactFiles",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EdifactItems_DeliveryStart_DeliveryEnd",
                table: "EdifactItems",
                columns: new[] { "DeliveryStart", "DeliveryEnd" });

            migrationBuilder.CreateIndex(
                name: "IX_EdifactItems_EdifactFileId",
                table: "EdifactItems",
                column: "EdifactFileId");

            migrationBuilder.CreateIndex(
                name: "IX_EdifactItems_IsProcessed",
                table: "EdifactItems",
                column: "IsProcessed");

            migrationBuilder.CreateIndex(
                name: "IX_EdifactItems_ItemCode",
                table: "EdifactItems",
                column: "ItemCode");

            migrationBuilder.CreateIndex(
                name: "IX_EdifactItems_ProductId",
                table: "EdifactItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_EdiProducts_EdiClientId_Description",
                table: "EdiProducts",
                columns: new[] { "EdiClientId", "Description" });

            migrationBuilder.CreateIndex(
                name: "IX_EdiProducts_IsActive",
                table: "EdiProducts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_EdiProducts_ProductId",
                table: "EdiProducts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_EdiRoutes_EdiClientId_Code",
                table: "EdiRoutes",
                columns: new[] { "EdiClientId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EdiRoutes_IsActive",
                table: "EdiRoutes",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Packagings_PackagingTypeId",
                table: "Packagings",
                column: "PackagingTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PackingListItems_BillingRequestItemId",
                table: "PackingListItems",
                column: "BillingRequestItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PackingListItems_IsConferenced",
                table: "PackingListItems",
                column: "IsConferenced");

            migrationBuilder.CreateIndex(
                name: "IX_PackingListItems_PackingListId",
                table: "PackingListItems",
                column: "PackingListId");

            migrationBuilder.CreateIndex(
                name: "IX_PackingListItems_ProductId",
                table: "PackingListItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_BillingRequestId",
                table: "PackingLists",
                column: "BillingRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_Code",
                table: "PackingLists",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_ConferencedById",
                table: "PackingLists",
                column: "ConferencedById");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_CreatedById",
                table: "PackingLists",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_CustomerId",
                table: "PackingLists",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_InvoicedById",
                table: "PackingLists",
                column: "InvoicedById");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_InvoiceNumber",
                table: "PackingLists",
                column: "InvoiceNumber");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_RequestedAt",
                table: "PackingLists",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_SeparatedById",
                table: "PackingLists",
                column: "SeparatedById");

            migrationBuilder.CreateIndex(
                name: "IX_PackingLists_Status",
                table: "PackingLists",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocations_IsPrimary",
                table: "ProductLocations",
                column: "IsPrimary");

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocations_LocationId",
                table: "ProductLocations",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocations_ProductId_LocationId",
                table: "ProductLocations",
                columns: new[] { "ProductId", "LocationId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_DefaultPackagingId",
                table: "Products",
                column: "DefaultPackagingId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Description",
                table: "Products",
                column: "Description");

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsActive",
                table: "Products",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Reference",
                table: "Products",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsActive",
                table: "Users",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role",
                table: "Users",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseLocations_Code",
                table: "WarehouseLocations",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseLocations_IsAvailable",
                table: "WarehouseLocations",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseLocations_Street_Rack_Level_Position",
                table: "WarehouseLocations",
                columns: new[] { "Street", "Rack", "Level", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseLocations_StreetId",
                table: "WarehouseLocations",
                column: "StreetId");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseStreets_Code",
                table: "WarehouseStreets",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseStreets_SortOrder",
                table: "WarehouseStreets",
                column: "SortOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerProducts");

            migrationBuilder.DropTable(
                name: "EdiConversions");

            migrationBuilder.DropTable(
                name: "EdifactItems");

            migrationBuilder.DropTable(
                name: "EdiProducts");

            migrationBuilder.DropTable(
                name: "PackingListItems");

            migrationBuilder.DropTable(
                name: "ProductLocations");

            migrationBuilder.DropTable(
                name: "EdiRoutes");

            migrationBuilder.DropTable(
                name: "EdifactFiles");

            migrationBuilder.DropTable(
                name: "BillingRequestItems");

            migrationBuilder.DropTable(
                name: "PackingLists");

            migrationBuilder.DropTable(
                name: "WarehouseLocations");

            migrationBuilder.DropTable(
                name: "EdiClients");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "BillingRequests");

            migrationBuilder.DropTable(
                name: "WarehouseStreets");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "Packagings");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "PackagingTypes");
        }
    }
}
