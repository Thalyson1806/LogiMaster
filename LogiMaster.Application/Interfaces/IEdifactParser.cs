using LogiMaster.Application.DTOs;
using LogiMaster.Domain.Enums;


namespace LogiMaster.Application.Interfaces;

public interface IEdifactParser
{

    EdifactMessageType MessageType { get; }
    ParsedEdifactResult Parse(string content);

}