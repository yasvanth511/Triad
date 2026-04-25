using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Helpers;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class EventService
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;

    public EventService(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<List<EventResponse>> GetEventsAsync(Guid userId, int skip = 0, int take = 50)
    {
        take = Math.Min(take, 100);

        using var activity = Telemetry.ActivitySource.StartActivity("events.get");
        activity?.SetTag("enduser.id", userId);

        try
        {
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("User not found.");

            var now = DateTime.UtcNow;

            var query = _db.Events
                .AsNoTracking()
                .Where(e => e.EventDate >= now);

            if (user.RadiusMiles.HasValue && user.Latitude.HasValue && user.Longitude.HasValue)
            {
                double radiusKm = GeoUtils.MilesToKilometres(user.RadiusMiles.Value);
                double latDelta = radiusKm / 111.0;
                double lonDelta = radiusKm /
                    (111.0 * Math.Cos(user.Latitude.Value * Math.PI / 180.0));

                double latMin = user.Latitude.Value - latDelta;
                double latMax = user.Latitude.Value + latDelta;
                double lonMin = user.Longitude.Value - lonDelta;
                double lonMax = user.Longitude.Value + lonDelta;

                query = query.Where(e =>
                    e.Latitude.HasValue && e.Longitude.HasValue &&
                    e.Latitude  >= (double?)latMin && e.Latitude  <= (double?)latMax &&
                    e.Longitude >= (double?)lonMin && e.Longitude <= (double?)lonMax);
            }

            var rows = await query
                .OrderBy(e => e.EventDate)
                .Select(e => new
                {
                    Event = e,
                    InterestedCount = e.Interests.Count(),
                    IsInterested = e.Interests.Any(i => i.UserId == userId)
                })
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            var response = rows.Select(row =>
            {
                var e = row.Event;
                double? distanceKm = null;
                if (user.Latitude.HasValue && user.Longitude.HasValue
                    && e.Latitude.HasValue && e.Longitude.HasValue)
                {
                    distanceKm = Math.Round(
                        GeoUtils.DistanceKm(user.Latitude.Value, user.Longitude.Value,
                                             e.Latitude.Value, e.Longitude.Value), 1);
                }

                if (user.RadiusMiles.HasValue && distanceKm.HasValue
                    && distanceKm.Value > GeoUtils.MilesToKilometres(user.RadiusMiles.Value))
                    return null;

                return new EventResponse(
                    e.Id, e.Title, e.Description, e.BannerUrl,
                    e.EventDate, e.City, e.State, e.Venue,
                    e.Latitude, e.Longitude, distanceKm,
                    row.InterestedCount, row.IsInterested);
            }).Where(e => e != null).Cast<EventResponse>().ToList();

            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get"),
                new KeyValuePair<string, object?>("outcome", "success"));
            activity?.SetTag("triad.events.returned", response.Count);
            Telemetry.MarkSuccess(activity);
            return response;
        }
        catch (Exception ex)
        {
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "get"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<EventInterestToggleResponse> ToggleInterestAsync(Guid userId, Guid eventId)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("events.toggle_interest");
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("triad.event.id", eventId);

        try
        {
            var existing = await _db.EventInterests
                .FirstOrDefaultAsync(ei => ei.UserId == userId && ei.EventId == eventId);

            if (existing != null)
            {
                _db.EventInterests.Remove(existing);
            }
            else
            {
                var ev = await _db.Events.FindAsync(eventId)
                    ?? throw new KeyNotFoundException("Event not found.");
                _db.EventInterests.Add(new EventInterest
                {
                    UserId = userId,
                    EventId = eventId
                });
            }

            await _db.SaveChangesAsync();

            var count = await _db.EventInterests.CountAsync(ei => ei.EventId == eventId);
            var isNowInterested = existing == null;
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "toggle_interest"),
                new KeyValuePair<string, object?>("outcome", isNowInterested ? "enabled" : "disabled"));
            Telemetry.MarkSuccess(activity);
            return new EventInterestToggleResponse(isNowInterested, count);
        }
        catch (Exception ex)
        {
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "toggle_interest"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<EventResponse> CreateEventAsync(CreateEventRequest req)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("events.create");

        try
        {
            var eventDateUtc = NormalizeToUtc(req.EventDate);
            var ev = new Event
            {
                Title = req.Title,
                Description = req.Description,
                BannerUrl = req.BannerUrl,
                EventDate = eventDateUtc,
                Latitude = req.Latitude,
                Longitude = req.Longitude,
                City = req.City ?? string.Empty,
                State = req.State ?? string.Empty,
                Venue = req.Venue ?? string.Empty,
            };
            _db.Events.Add(ev);
            await _db.SaveChangesAsync();
            _cache.Remove("events:upcoming");
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "create"),
                new KeyValuePair<string, object?>("outcome", "success"));
            activity?.SetTag("triad.event.id", ev.Id);
            Telemetry.MarkSuccess(activity);
            return new EventResponse(ev.Id, ev.Title, ev.Description, ev.BannerUrl,
                ev.EventDate, ev.City, ev.State, ev.Venue,
                ev.Latitude, ev.Longitude, null, 0, false);
        }
        catch (Exception ex)
        {
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "create"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<bool> DeleteEventAsync(Guid id)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("events.delete");
        activity?.SetTag("triad.event.id", id);

        try
        {
            var ev = await _db.Events.FindAsync(id);
            if (ev == null)
            {
                Telemetry.EventOperations.Add(1,
                    new KeyValuePair<string, object?>("operation", "delete"),
                    new KeyValuePair<string, object?>("outcome", "not_found"));
                Telemetry.MarkSuccess(activity);
                return false;
            }

            _db.Events.Remove(ev);
            await _db.SaveChangesAsync();
            _cache.Remove("events:upcoming");
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "delete"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return true;
        }
        catch (Exception ex)
        {
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "delete"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task CleanupDuplicateEventsAsync()
    {
        using var activity = Telemetry.ActivitySource.StartActivity("events.cleanup_duplicates");

        try
        {
            await _db.Database.ExecuteSqlRawAsync("""
                DELETE FROM "Events"
                WHERE "Id" NOT IN (
                    SELECT DISTINCT ON ("Title") "Id"
                    FROM "Events"
                    ORDER BY "Title", "CreatedAt"
                )
                """);
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "cleanup_duplicates"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
        }
        catch (Exception ex)
        {
            Telemetry.EventOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "cleanup_duplicates"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

}
