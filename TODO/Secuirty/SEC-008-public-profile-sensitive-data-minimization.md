# SEC-008: Minimize Sensitive Data in Public Profile Responses

## Risk Level
High

## Security Area
Data Security

## Problem
The same `UserProfileResponse` mapper is used for both the current user's private profile and another user's public profile. Public profile responses include ZIP code, radius, red flags, audio/video URLs, and multiple detailed preference fields.

## Why This Matters
Public-profile APIs can expose more personal data than is necessary for discovery or profile viewing. Reusing the private profile DTO for public responses makes future sensitive fields easy to leak by default.

## Evidence From Code
- `backend/ThirdWheel.API/Services/ProfileService.cs`
  - `GetProfileAsync()` returns `UserMapper.ToProfileResponse(user)`.
  - `GetPublicProfileAsync()` also returns `UserMapper.ToProfileResponse(user)`.
- `backend/ThirdWheel.API/DTOs/Dtos.cs`
  - `UserProfileResponse` includes `ZipCode`, `RadiusMiles`, `RedFlags`, `AudioBioUrl`, `VideoBioUrl`, videos, and detailed preference attributes.
- `backend/ThirdWheel.API/Helpers/UserMapper.cs` maps all these fields unconditionally.
- `backend/ThirdWheel.API/Controllers/ProfileController.cs`
  - `GET /api/profile/{userId}` uses `GetPublicProfileAsync`.

## Recommended Fix
Create separate DTOs/mappers for private self profile and public profile views. Public responses should include only fields intentionally visible to other users.

## Implementation Steps
1. Define a dedicated public profile response DTO.
2. Implement a public mapper that excludes ZIP code, radius, and any sensitive/private preference fields not intended for public display.
3. Update `GetPublicProfileAsync()` to use the public mapper.
4. Keep `GetProfileAsync()` using a private/self mapper.
5. Review discovery, match participant, and saved-profile DTOs for similar minimization boundaries.

## Acceptance Criteria
- `GET /api/profile/{userId}` no longer returns the private/self profile DTO.
- Public profile responses exclude ZIP code and other non-essential sensitive fields.
- Private self-profile responses still return fields required for profile editing.
- New profile fields cannot automatically leak publicly through a shared mapper.

## Not Included
Tests and deployment are intentionally excluded.

## Notes
This task is about API/data minimization, not product decisions about which profile attributes should exist.
