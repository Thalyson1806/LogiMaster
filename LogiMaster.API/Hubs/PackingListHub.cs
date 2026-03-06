using System.Collections.Concurrent;
using LogiMaster.Application.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace LogiMaster.API.Hubs;

public class PackingListHub : Hub
{
    public static readonly ConcurrentDictionary<int, DriverLocationDto> ActiveDrivers = new();

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }
}
