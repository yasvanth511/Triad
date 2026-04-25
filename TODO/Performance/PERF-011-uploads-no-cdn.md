# PERF-011: Profile Media Served from Local Disk Through the API Process

## Problem
All user photos, audio bios, and video bios are stored on the API server's local filesystem under `uploads/` and served directly via `UseStaticFiles` with a `PhysicalFileProvider`. Every media request hits the API process, consuming request threads, file I/O, and bandwidth that could otherwise serve API traffic.

## Impact
- Profile cards with photos fire one HTTP request per photo directly at the API.
- On a mobile network, downloading a 500 KB profile photo through the API server adds ~200–500 ms per image.
- API throughput (rate limit: 120 req/min/IP) is consumed by static file requests, not just API calls.
- In a Docker/container setup, the `uploads/` directory is not persisted across container restarts unless explicitly mounted — media is silently lost on redeploy.
- No CDN edge caching, no image resizing, no WebP conversion.

## Evidence
- [Program.cs:376-383](backend/ThirdWheel.API/Program.cs#L376-L383) — `UseStaticFiles` with `PhysicalFileProvider` over `/uploads`.
- `AGENTS.md` (line 46): "Uploaded media is stored locally under `uploads/` and served from `/uploads`".
- `docs/ai/context.md` (line 44): "Uploaded media is stored locally under `uploads/` and served from `/uploads`".

## Recommended Fix
1. **Short-term**: Add `Cache-Control: public, max-age=86400` (1 day) and `ETag` headers to the static file middleware so CDN edges and browsers cache media files.
2. **Medium-term**: Move uploads to a blob storage service (e.g., AWS S3, Azure Blob, Cloudflare R2) and return signed or public CDN URLs. The `ImageService` class is a good place to swap the storage backend.
3. **Container fix**: Ensure `uploads/` is mounted as a persistent volume in `docker-compose.yml` (verify this is already the case or add it).

## Scope
**Change (short-term)**:
- `Program.cs` — add `OnPrepareResponse` callback to set `Cache-Control` on the static file middleware.

**Change (medium-term)**:
- `ImageService.cs` — replace `File.WriteAllBytesAsync` with blob storage SDK upload; return CDN URL instead of local path.

**Do not change:**
- `ProfileService`, DTOs, any client code (URLs remain opaque strings), migrations.

## Validation
- Manual: upload a photo, then inspect response headers for `Cache-Control` and `ETag`.
- Network check: second request for the same media file returns `304 Not Modified`.
- Verify photo URLs still resolve correctly after change.

## Risk
Medium for blob storage migration — requires secrets management (bucket credentials), URL format change for existing stored URLs, and data migration of existing uploaded files. Start with cache headers (zero risk) then plan blob migration separately.

## Priority
P2 medium

## Effort
Large (blob migration) / Small (cache headers only)

## Suggested Agent Prompt
```
Task: Add Cache-Control headers to static file responses in Program.cs.
In Program.cs, update the UseStaticFiles call to include OnPrepareResponse:
  app.UseStaticFiles(new StaticFileOptions
  {
      FileProvider = new PhysicalFileProvider(uploadsPath),
      RequestPath = "/uploads",
      OnPrepareResponse = ctx =>
      {
          ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=86400";
      }
  });
Do not change ImageService.cs, DTOs, migrations, or client code.
Run: cd backend/ThirdWheel.API && dotnet build
Then manually upload a photo and verify Cache-Control: public, max-age=86400 appears in response headers.
```
