using System.Diagnostics;
using System.Diagnostics.Metrics;
using OpenTelemetry.Trace;

namespace ThirdWheel.API;

public static class Telemetry
{
    public const string ServiceName = "ThirdWheel.API";

    public static readonly ActivitySource ActivitySource = new(ServiceName);
    public static readonly Meter Meter = new(ServiceName);

    public static readonly Counter<long> AuthOperations =
        Meter.CreateCounter<long>("triad.auth.operations", description: "Authentication operations by outcome.");

    public static readonly Counter<long> CoupleOperations =
        Meter.CreateCounter<long>("triad.couple.operations", description: "Couple operations by action and outcome.");

    public static readonly Counter<long> DiscoveryRequests =
        Meter.CreateCounter<long>("triad.discovery.requests", description: "Discovery feed requests by outcome.");

    public static readonly Histogram<long> DiscoveryCardsReturned =
        Meter.CreateHistogram<long>("triad.discovery.cards_returned", description: "Number of discovery cards returned.");

    public static readonly Counter<long> MatchOperations =
        Meter.CreateCounter<long>("triad.match.operations", description: "Match operations by action and outcome.");

    public static readonly Counter<long> MessagesSent =
        Meter.CreateCounter<long>("triad.messaging.sent", description: "Messages sent through the platform.");

    public static readonly Histogram<long> MessagesFetched =
        Meter.CreateHistogram<long>("triad.messaging.fetched", description: "Message batch sizes returned from history.");

    public static readonly Counter<long> SafetyOperations =
        Meter.CreateCounter<long>("triad.safety.operations", description: "Safety operations such as spam, block, and report.");

    public static readonly Counter<long> ProfileOperations =
        Meter.CreateCounter<long>("triad.profile.operations", description: "Profile and photo operations by outcome.");

    public static readonly Counter<long> EventOperations =
        Meter.CreateCounter<long>("triad.events.operations", description: "Event operations by action and outcome.");

    public static readonly Counter<long> RealtimeOperations =
        Meter.CreateCounter<long>("triad.realtime.operations", description: "Realtime chat and SignalR operations by outcome.");

    public static void MarkSuccess(Activity? activity)
    {
        activity?.SetStatus(ActivityStatusCode.Ok);
    }

    public static void RecordException(Activity? activity, Exception exception)
    {
        if (activity == null)
        {
            return;
        }

        activity.SetStatus(ActivityStatusCode.Error, exception.Message);
        activity.RecordException(exception);
    }
}
