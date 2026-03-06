using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class EdiSeedService
{
    private readonly IUnitOfWork _unitOfWork;

    public EdiSeedService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        // Verificar se já existe dados
        var existingClients = await _unitOfWork.EdiClients.GetAllAsync(cancellationToken);
        if (existingClients.Any())
        {
            return; // Já tem dados, não faz seed
        }

        // ===== DAS =====
        var das = new EdiClient("DAS", "DAS Automotive");
        das.Update(
            "DAS Automotive",
            "Cliente com blocos FIRME/PREVISÃO",
            null,
            null,
            "{\"temCabecalho\":true,\"detectarBlocos\":true}",
            "{\"diaLimite\":25,\"excluirUltimosDias\":2}",
            "xlsx"
        );
        await _unitOfWork.EdiClients.AddAsync(das, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Roteiros DAS
        await AddDasRoute(das.Id, "padrao", "5x por semana (Padrão)", "dias_corridos", 5, null, null, true, cancellationToken);
        await AddDasRoute(das.Id, "1x_semana", "1x por semana", "dias_corridos", 1, null, null, false, cancellationToken);
        await AddDasRoute(das.Id, "2x_semana", "2x por semana", "dias_corridos", 2, null, null, false, cancellationToken);
        await AddDasRoute(das.Id, "3x_semana", "3x por semana", "dias_corridos", 3, null, null, false, cancellationToken);
        await AddDasRoute(das.Id, "terca_quinta", "Terça e Quinta", "dias_especificos", null, null, "[2,4]", false, cancellationToken);
        await AddDasRoute(das.Id, "quinzenal", "Quinzenal (Sexta)", "dias_especificos", null, 14, "[5]", false, cancellationToken);

        // ===== AMVIAN =====
        var amvian = new EdiClient("AMVIAN", "AMVIAN");
        amvian.Update(
            "AMVIAN",
            "Cliente simples - código e quantidade",
            null,
            null,
            "{\"temCabecalho\":true,\"colunas\":{\"codigo\":\"A\",\"quantidade\":\"B\"}}",
            "{\"naoEntregaFeriados\":true}",
            "xlsx"
        );
        await _unitOfWork.EdiClients.AddAsync(amvian, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var amvianRoute = new EdiRoute(amvian.Id, "padrao", "Todas as sextas-feiras", "dias_especificos");
        amvianRoute.Update("Todas as sextas-feiras", "dias_especificos", "[5]", null, null, "Entrega toda sexta-feira", true);
        await _unitOfWork.EdiRoutes.AddAsync(amvianRoute, cancellationToken);

        // ===== COPO =====
        var copo = new EdiClient("COPO", "COPO");
        copo.Update(
            "COPO",
            "Arquivo TXT - formato livre",
            null,
            null,
            "{\"tipo\":\"texto_livre\"}",
            "{\"naoEntregaFeriados\":true}",
            "txt"
        );
        await _unitOfWork.EdiClients.AddAsync(copo, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var copoRoute = new EdiRoute(copo.Id, "padrao", "Terça e Sexta", "dias_especificos");
        copoRoute.Update("Terça e Sexta", "dias_especificos", "[2,5]", null, null, "Entrega terça e sexta-feira", true);
        await _unitOfWork.EdiRoutes.AddAsync(copoRoute, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
        private async Task AddDasRoute(int clientId, string code, string name, string type, 
        int? freqWeek, int? freqDays, string? days, bool isDefault, CancellationToken ct)
    {
        var route = new EdiRoute(clientId, code, name, type);
        route.Update(name, type, days, freqWeek, freqDays, null, isDefault);
        await _unitOfWork.EdiRoutes.AddAsync(route, ct);
    }

}
