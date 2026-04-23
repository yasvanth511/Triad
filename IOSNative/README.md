# IOSNative

`IOSNative` is a fully native iOS app scaffold built with SwiftUI. It talks to the ASP.NET backend with native iOS frameworks like `SwiftUI`, `URLSession`, `Security` (Keychain), and `CoreLocation`.

## What is included

- Native SwiftUI app entry point
- Login and registration flows against `/api/auth/*`
- Persistent auth token storage in Keychain
- Native tab flow for Discover, Matches, Events, and Profile
- Native location permission request flow
- Xcode project and shared scheme
- Local HTTP development support via App Transport Security exceptions

## Open and run

1. Copy this folder to a Mac with Xcode 16 or newer.
2. Open [ThirdWheelNative.xcodeproj](</c:/Apps/Triad/IOSNative/ThirdWheelNative.xcodeproj>).
3. In Xcode, set your Apple Developer Team for the `ThirdWheelNative` target.
4. Update `APIBaseURL` in [ThirdWheelNative/Info.plist](</c:/Apps/Triad/IOSNative/ThirdWheelNative/Info.plist:1>) if you want to run on a physical iPhone.
5. Build and run.

## Backend URL behavior

- iOS Simulator defaults to `http://localhost:5127`
- Physical devices read `APIBaseURL` from `Info.plist`
- The app automatically appends `/api`

## Current scope

This scaffold is intentionally focused on the core authenticated flow and backend integration, with the project structure ready for native additions such as real-time SignalR chat and photo uploads.
