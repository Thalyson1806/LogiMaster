using LogiMaster.Application.Interfaces;
using LogiMaster.Application.Services;
using LogiMaster.Infrastructure.Edifact;
using LogiMaster.Infrastructure.Services;
using LogiMaster.Application.Settings;
using LogiMaster.API.Authorization;
using LogiMaster.API.Hubs;
using LogiMaster.API.Extensions;
using LogiMaster.Domain.Enums;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;


var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "LogiMaster API", Version = "v1" });
    
    // Configuração do Swagger para JWT
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header usando Bearer. Exemplo: 'Bearer {token}'"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

/// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});



// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "LogiMasterSecretKey2026SuperSecure123!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LogiMaster";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LogiMaster";



builder.Services.AddSingleton<IAuthorizationHandler, ModuleAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    // Registra apenas valores de bit único (potências de 2)
    foreach (AppModule module in Enum.GetValues<AppModule>())
    {
        var v = (long)module;
        if (v == 0 || (v & (v - 1)) != 0) continue; // pula None e compostos
        options.AddPolicy($"Module.{module}", policy =>
            policy.Requirements.Add(new ModuleRequirement(module)));
    }
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

// DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<LogiMasterDbContext>(options =>
    options.UseNpgsql(connectionString));

// Application services
builder.Services.AddApplicationServices();
builder.Services.AddSignalR();


//endereçamento
builder.Services.AddScoped<IWarehouseService, WarehouseService>();

//email
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();

// EDIFACT
builder.Services.AddScoped<IEdifactService, EdifactService>();
builder.Services.AddScoped<IEdifactParser, DelforParser>();
builder.Services.AddScoped<IEdifactParser, DeljitParser>();
builder.Services.AddScoped<IEdifactParser, RndParser>();
builder.Services.AddHostedService<EdifactProcessingService>();


// EDI File Watcher (importação automática de pasta)
builder.Services.Configure<EdiFileWatcherSettings>(builder.Configuration.GetSection("EdiFileWatcher"));
builder.Services.AddHostedService<EdiFileWatcherService>();


//missing parts
builder.Services.AddScoped<IMissingPartsService, MissingPartsService>();

//stock
builder.Services.AddScoped<IStockService, StockService>();

// auditoria
builder.Services.AddScoped<IAuditService, AuditService>();

var app = builder.Build();

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();  // <- IMPORTANTE: antes do Authorization
app.UseAuthorization();

app.MapControllers();
app.MapHub<PackingListHub>("/hubs/packing-list");

// Auto-migrate
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<LogiMasterDbContext>();
    await db.Database.MigrateAsync();
        // Seed EDI
    var ediSeed = scope.ServiceProvider.GetRequiredService<EdiSeedService>();
    await ediSeed.SeedAsync();

}


app.Run();
