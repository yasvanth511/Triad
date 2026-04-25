# SEC_009 — Move SignalR JWT from Query String to Authorization Header

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC6.7  
**Status:** Open  
**Effort:** Small (half day)

---

## Problem

The SignalR WebSocket connection authenticates by reading the JWT from a query string parameter `?access_token=`:

```csharp
// Program.cs
options.Events = new JwtBearerEvents {
    OnMessageReceived = ctx => {
        var accessToken = ctx.Request.Query["access_token"];
        var path = ctx.HttpContext.Request.Path;
        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs")) {
            ctx.Token = accessToken;
        }
    }
};
```

This means the JWT is:

- Logged in full by web servers, load balancers, and API gateways (URL parameters appear in access logs).
- Stored in browser history.
- Included in `Referer` headers sent to third-party resources.
- Visible in network monitoring tools.

## Fix

### Option A — Custom Header on WebSocket Upgrade (Recommended for Native Clients)

For the iOS app, pass the token in a custom header during the WebSocket handshake:

```swift
// iOS — HubConnectionBuilder
let connection = HubConnectionBuilder(url: URL(string: hubUrl)!)
    .withHttpConnectionOptions { options in
        options.headers["Authorization"] = "Bearer \(token)"
    }
    .build()
```

On the server, read the token from the `Authorization` header first, fall back to query string only if the path is a hub:

```csharp
OnMessageReceived = ctx => {
    // Prefer Authorization header
    var authHeader = ctx.Request.Headers.Authorization.ToString();
    if (authHeader.StartsWith("Bearer ")) {
        ctx.Token = authHeader["Bearer ".Length..];
        return Task.CompletedTask;
    }
    // Fallback for clients that can't set headers on WS upgrade
    var accessToken = ctx.Request.Query["access_token"];
    if (!string.IsNullOrEmpty(accessToken) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs")) {
        ctx.Token = accessToken;
    }
    return Task.CompletedTask;
}
```

### Option B — Short-Lived One-Time Token for Hub Connection

Issue a separate short-lived (5-minute) hub connection token via `POST /api/auth/hub-token`. The client exchanges its main JWT for this token, uses it to connect, and discards it. The hub token never appears in URLs.

### Web Client

The `@microsoft/signalr` JS client supports passing the token as a bearer factory:

```typescript
const connection = new HubConnectionBuilder()
    .withUrl('/hubs/chat', {
        accessTokenFactory: () => getSessionToken()
    })
    .build();
```

This uses the `Authorization: Bearer` header on the HTTP upgrade request, not the query string.

## Files To Edit

- `backend/ThirdWheel.API/Program.cs` — update `OnMessageReceived` handler
- `IOSNative/ThirdWheelNative/` — update SignalR connection builder to use Authorization header
- `web/triad-web/src/features/matches/` — update SignalR connection to use `accessTokenFactory`

## Verification

```bash
# Confirm JWT does not appear in server access logs when connecting via WebSocket
# Check that hub still authenticates correctly with header-only token
```

## Fix Prompt

```
In backend/ThirdWheel.API/Program.cs, update OnMessageReceived to:
    OnMessageReceived = ctx => {
        var authHeader = ctx.Request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) {
            ctx.Token = authHeader["Bearer ".Length..];
            return Task.CompletedTask;
        }
        var qs = ctx.Request.Query["access_token"].ToString();
        if (!string.IsNullOrEmpty(qs) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
            ctx.Token = qs;
        return Task.CompletedTask;
    }

In IOSNative/ThirdWheelNative/ (find the HubConnectionBuilder call):
    .withHttpConnectionOptions { options in
        options.headers["Authorization"] = "Bearer \(token)"
    }
Remove the ?access_token= query parameter if present.

In web/triad-web/src/features/matches/ (find the HubConnectionBuilder call):
Replace .withUrl('/hubs/chat') with:
    .withUrl('/hubs/chat', { accessTokenFactory: () => getSessionToken() })
Remove any ?access_token= query string construction.
```
