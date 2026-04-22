using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ThirdWheel.API.Services;

namespace ThirdWheel.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly MessagingService _messagingService;
    private readonly MatchingService _matchingService;

    public ChatHub(MessagingService messagingService, MatchingService matchingService)
    {
        _messagingService = messagingService;
        _matchingService = matchingService;
    }

    public override async Task OnConnectedAsync()
    {
        using var activity = Telemetry.ActivitySource.StartActivity("signalr.connected");
        var userId = GetUserId();
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("network.protocol.name", "signalr");
        await Groups.AddToGroupAsync(Context.ConnectionId, userId.ToString());
        Telemetry.RealtimeOperations.Add(1,
            new KeyValuePair<string, object?>("operation", "connect"),
            new KeyValuePair<string, object?>("outcome", "success"));
        Telemetry.MarkSuccess(activity);
        await base.OnConnectedAsync();
    }

    public async Task JoinMatch(string matchId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("signalr.join_match");
        var userId = GetUserId();
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);
        var participantIds = await _matchingService.GetMatchParticipantIdsAsync(Guid.Parse(matchId));
        if (!participantIds.Contains(userId))
            throw new HubException("You are not a participant of this match.");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"match_{matchId}");
        Telemetry.RealtimeOperations.Add(1,
            new KeyValuePair<string, object?>("operation", "join_match"),
            new KeyValuePair<string, object?>("outcome", "success"));
        Telemetry.MarkSuccess(activity);
    }

    public async Task LeaveMatch(string matchId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("signalr.leave_match");
        activity?.SetTag("triad.match.id", matchId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"match_{matchId}");
        Telemetry.RealtimeOperations.Add(1,
            new KeyValuePair<string, object?>("operation", "leave_match"),
            new KeyValuePair<string, object?>("outcome", "success"));
        Telemetry.MarkSuccess(activity);
    }

    public async Task SendMessage(string matchId, string content)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("signalr.send_message");
        var userId = GetUserId();
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.match.id", matchId);

        try
        {
            var message = await _messagingService.SendMessageAsync(
                userId, Guid.Parse(matchId), content);

            await Clients.Group($"match_{matchId}").SendAsync("ReceiveMessage", message);
            Telemetry.RealtimeOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "send_message"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (KeyNotFoundException ex)
        {
            Telemetry.RealtimeOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "send_message"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            await Clients.Caller.SendAsync("MessageError", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            Telemetry.RealtimeOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "send_message"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            await Clients.Caller.SendAsync("MessageError", ex.Message);
        }
    }

    public async Task MarkRead(string matchId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("signalr.mark_read");
        activity?.SetTag("triad.match.id", matchId);
        await Clients.OthersInGroup($"match_{matchId}").SendAsync("MessagesRead", matchId);
        Telemetry.RealtimeOperations.Add(1,
            new KeyValuePair<string, object?>("operation", "mark_read"),
            new KeyValuePair<string, object?>("outcome", "success"));
        Telemetry.MarkSuccess(activity);
    }

    private Guid GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new HubException("User not authenticated.");
        return Guid.Parse(claim);
    }
}
