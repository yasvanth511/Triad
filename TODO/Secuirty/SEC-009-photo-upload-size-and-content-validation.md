# SEC-009: Add Photo Upload Size and Content Validation Before Decode

## Risk Level
Medium

## Security Area
API Security

## Problem
Photo upload endpoints do not set request size limits, and photo processing loads the image stream before enforcing a size limit. Audio/video uploads have explicit request limits, but photos do not.

## Why This Matters
Unbounded image uploads can consume memory, CPU, disk, and image parser resources. Image decoders are also common attack surfaces, so limits should be enforced before expensive parsing.

## Evidence From Code
- `backend/ThirdWheel.API/Controllers/ProfileController.cs`
  - `UploadPhoto(IFormFile file)` has no `[RequestSizeLimit]`.
  - Audio/video upload actions have `[RequestSizeLimit(...)]`.
- `backend/ThirdWheel.API/Controllers/BusinessController.cs`
  - `UploadLogo(IFormFile file)` has no `[RequestSizeLimit]`.
  - `UploadEventImage(Guid id, IFormFile file)` has no `[RequestSizeLimit]`.
- `backend/ThirdWheel.API/Services/ImageService.cs`
  - `SavePhotoAsync(Stream imageStream, string fileName)` calls `Image.LoadAsync(imageStream)` before any byte limit check.
- `backend/ThirdWheel.API/AppConstants.cs` has `MaxImageWidthPx` but no max photo byte-size constant.

## Recommended Fix
Add explicit request size limits for all photo/image upload endpoints and validate content length/type before decoding. Keep ImageSharp metadata stripping and resizing after safe pre-validation.

## Implementation Steps
1. Add `MaxPhotoSizeMb` or equivalent to `AppConstants`.
2. Add `[RequestSizeLimit]` to all photo/logo/event-image upload actions.
3. Pass `file.ContentType` and `file.Length` into image validation.
4. Reject unsupported image MIME types before decoding.
5. Reject oversized files before decoding.
6. Keep generated server-side filenames and metadata stripping.

## Acceptance Criteria
- All image upload endpoints have explicit request size limits.
- Oversized image uploads are rejected before image decoding.
- Unsupported image MIME types are rejected before image decoding.
- Existing audio/video limits remain intact.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This task is limited to file/media handling directly related to storage/security.
