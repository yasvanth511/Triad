# SEC_016 — Restrict Media / Uploads Access and Add Content Scanning

**Severity:** HIGH  
**SOC 2 Criteria:** CC6.1, CC6.8  
**Status:** Open  
**Effort:** Medium (2–3 days)

---

## Problem

### Unauthenticated Media Access

Uploaded files are served from `/uploads/*` with no authentication:

```csharp
// Program.cs
app.UseStaticFiles(new StaticFileOptions {
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});
```

Anyone who knows or can guess the URL of a file (`/uploads/photos/abc123.jpg`) can access it without being logged in, without being matched with the profile, and even after being blocked by the profile owner.

### No Content Scanning

Uploaded files (photos, videos, audio) are not scanned for:

- Malware / malicious payloads embedded in media files
- CSAM (Child Sexual Abuse Material)
- Explicit content policy violations

For a dating platform this is a significant legal and reputational risk.

## Fix

### Phase 1 — Authentication Gate on Uploads

Replace the static file middleware with an authenticated controller endpoint:

```csharp
// New: MediaController.cs
[Authorize]
[HttpGet("media/{**path}")]
public async Task<IActionResult> ServeMedia(string path)
{
    // 1. Validate path doesn't escape uploads directory (path traversal)
    var safePath = Path.GetFullPath(Path.Combine(_uploadsRoot, path));
    if (!safePath.StartsWith(_uploadsRoot)) return NotFound();

    // 2. Optional: verify requester has access to this media
    //    (e.g., must be matched with the profile owner, or be the owner)

    // 3. Serve file
    var mimeType = _mimeMapper.GetMimeType(safePath);
    return PhysicalFile(safePath, mimeType);
}
```

### Phase 2 — Pre-Signed URLs (Recommended for Production)

Instead of serving files from the API server:

1. Migrate media storage from local disk to an object store (AWS S3, GCS, Supabase Storage).
2. Generate pre-signed URLs with a short TTL (15 minutes) when a client requests a resource.
3. The API issues the URL; the client fetches directly from the CDN.
4. Expired URLs cannot be replayed.

### Phase 3 — Content Scanning

1. **CSAM detection**: Integrate Microsoft PhotoDNA or Google SafeSearch before accepting any image upload. Reject and flag any match.
2. **Malware scanning**: Run uploaded files through ClamAV (open source) or a cloud AV API on upload.
3. **Explicit content moderation**: Use AWS Rekognition Content Moderation or Google Vision SafeSearch for adult content policy enforcement.

All scanning must happen **synchronously before the upload is accepted** for CSAM. Async scanning is acceptable for nudity policy enforcement with a quarantine state.

### Path Traversal Prevention (Immediate)

The current static files middleware restricts to the `uploads/` directory by design, but any future controller serving files must explicitly validate the resolved path:

```csharp
var safePath = Path.GetFullPath(Path.Combine(uploadsRoot, userProvidedPath));
if (!safePath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase))
    return BadRequest("Invalid path");
```

## Files To Edit

- `backend/ThirdWheel.API/Program.cs` — remove unauthenticated static file serving for uploads
- `backend/ThirdWheel.API/Controllers/MediaController.cs` — new authenticated media controller
- `backend/ThirdWheel.API/Services/MediaScanService.cs` — new service for content scanning
- `backend/ThirdWheel.API/Services/ImageService.cs` — add scan call on upload

## Fix Prompt

```
In backend/ThirdWheel.API/Program.cs:
- Remove (or comment out) the app.UseStaticFiles block that serves /uploads.

Create backend/ThirdWheel.API/Controllers/MediaController.cs:
    [Authorize]
    [Route("api/media")]
    public class MediaController : BaseController {
        private readonly string _uploadsRoot;
        public MediaController(IWebHostEnvironment env) =>
            _uploadsRoot = Path.GetFullPath(Path.Combine(env.ContentRootPath, "uploads"));

        [HttpGet("{**path}")]
        public IActionResult Serve(string path) {
            var safePath = Path.GetFullPath(Path.Combine(_uploadsRoot, path));
            if (!safePath.StartsWith(_uploadsRoot, StringComparison.OrdinalIgnoreCase))
                return NotFound();
            if (!System.IO.File.Exists(safePath)) return NotFound();
            var mime = MimeTypes.GetMimeType(safePath); // use MimeTypesMap NuGet or similar
            return PhysicalFile(safePath, mime);
        }
    }

Update all client code that constructs /uploads/ URLs to use /api/media/ instead:
- Search for "/uploads/" in web/triad-web/src/, IOSNative/, and admin/nextjs-admin/ and update each.
```
