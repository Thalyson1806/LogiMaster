using LogiMaster.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LogiMaster.Infrastructure.Services;

public class EdifactProcessingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EdifactProcessingService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public EdifactProcessingService(
        IServiceProvider serviceProvider,
        ILogger<EdifactProcessingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EdifactProcessingService iniciado");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingFiles(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no processamento automático de EDIFACT");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("EdifactProcessingService finalizado");
    }

    private async Task ProcessPendingFiles(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var edifactService = scope.ServiceProvider.GetRequiredService<IEdifactService>();

        _logger.LogDebug("Verificando arquivos EDIFACT pendentes...");
        await edifactService.ProcessPendingFilesAsync(ct);
    }
}
