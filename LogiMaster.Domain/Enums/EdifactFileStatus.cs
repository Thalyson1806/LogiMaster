namespace LogiMaster.Domain.Enums;

public enum EdifactFileStatus
{
    Pending = 0,      // Aguardando processamento
    Processing = 1,   // Em processamento
    Completed = 2,    // Processado com sucesso
    Error = 3,        // Erro no processamento
    PartialError = 4  // Processado com alguns erros
}
