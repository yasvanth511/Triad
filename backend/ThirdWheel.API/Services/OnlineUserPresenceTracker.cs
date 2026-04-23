using System.Collections.Concurrent;

namespace ThirdWheel.API.Services;

public static class OnlineUserPresenceTracker
{
    private static readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, byte>> Connections = new();

    public static void MarkOnline(Guid userId, string connectionId)
    {
        var userConnections = Connections.GetOrAdd(userId, static _ => new ConcurrentDictionary<string, byte>());
        userConnections[connectionId] = 0;
    }

    public static void MarkOffline(Guid userId, string connectionId)
    {
        if (!Connections.TryGetValue(userId, out var userConnections))
            return;

        userConnections.TryRemove(connectionId, out _);

        if (userConnections.IsEmpty)
            Connections.TryRemove(userId, out _);
    }

    public static Guid[] GetOnlineUserIds() => Connections.Keys.ToArray();
}
