# AI File Map

Use this map before reading source. It lists the files most likely to matter for scoped AI work.

## Top-Level Folders

- `backend/ThirdWheel.API/`: ASP.NET Core API, EF models, controllers, services, migrations, Dockerfile.
- `IOSNative/ThirdWheelNative/`: SwiftUI iOS app source.
- `android/`: Kotlin + Jetpack Compose Android app source, Gradle wrapper, app module under `android/app/`.
- `web/triad-web/`: consumer Next.js app.
- `web/triad-site/`: public marketing Next.js website.
- `web/triad-business/`: business partner Next.js app and Dockerfile.
- `admin/nextjs-admin/`: active Next.js admin dashboard.
- `admin/Admin.Host/`: ASP.NET static host and API proxy for admin deployment.
- `admin/`: also contains older static admin files; verify before editing them.
- `tests/`: backend unit, integration, and shared test helpers.
- `scripts/`: setup, Docker, test, mobile, and deploy scripts.
- `docs/ai/`: compact AI development guidance.

## Most Important Files

- `AGENTS.md`: source of truth for all AI agents.
- `CLAUDE.md`: short Claude entrypoint only.
- `README.md`: setup, command, endpoint, and deployment reference.
- `Product.md`: product behavior and positioning.
- `backend/ThirdWheel.API/Program.cs`: runtime wiring.
- `backend/ThirdWheel.API/AppConstants.cs`: app roles, policies, limits.
- `backend/ThirdWheel.API/Data/AppDbContext.cs`: schema relationships, indexes, seed categories.
- `backend/ThirdWheel.API/DTOs/*.cs`: API contracts.
- `backend/ThirdWheel.API/Services/*.cs`: backend business rules.
- `backend/ThirdWheel.API/Controllers/*.cs`: route surface.
- `web/*/src/lib/api/*.ts` and `web/*/src/lib/types.ts`: web contract mirrors.
- `IOSNative/ThirdWheelNative/APIClient.swift` and `Models.swift`: iOS contract mirrors.
- `android/app/src/main/java/com/triad/app/core/network/ApiClient.kt`, `data/Models.kt`, and `data/Requests.kt`: Android contract mirrors. The full iOS → Android map is `docs/android/ios-parity-map.md`.

## Safe To Edit Often

- Feature-specific backend service/controller/DTO/model/test files for the requested change.
- Feature-specific web files under `src/features`, `src/components`, `src/app`, `src/lib/api`, and `src/lib/types.ts`.
- Feature-specific iOS Swift files under `IOSNative/ThirdWheelNative`.
- Feature-specific Android Kotlin files under `android/app/src/main/java/com/triad/app/`.
- Backend tests under `tests/ThirdWheel.API.UnitTests` and `tests/ThirdWheel.API.IntegrationTests`.
- AI docs under `docs/ai/` when durable context changes.

## Requires Caution

- `backend/ThirdWheel.API/Migrations/*` and `AppDbContextModelSnapshot.cs`.
- `backend/ThirdWheel.API/Program.cs`, auth, CORS, rate limiting, uploads, and OpenTelemetry setup.
- `backend/ThirdWheel.API/AppConstants.cs` if changing business limits.
- `backend/ThirdWheel.API/appsettings*.json`.
- `docker-compose.yml`, Dockerfiles, `scripts/deploy/*`, `scripts/common/*`.
- `IOSNative/ThirdWheelNative.xcodeproj/project.pbxproj`.
- `android/build.gradle.kts`, `android/settings.gradle.kts`, `android/app/build.gradle.kts`, `android/gradle/libs.versions.toml`, and the Gradle wrapper at `android/gradle/wrapper/`.
- `package.json`, `package-lock.json`, `.csproj`, `NuGet.Config`.
- `admin/app.js`, `admin/index.html`, `admin/styles.css` because they may be legacy.

## Generated Or Build Files

- Do not manually edit `.next/`, `bin/`, `obj/`, `DerivedData/`, `.vercel/`, `uploads/`, `android/.gradle/`, `android/app/build/`, `android/build/`, `dist/android/`, or local `.dotnet/` sentinel files.
- Some generated files may appear tracked in this repo; avoid touching them unless the task is explicit cleanup.

## Secrets And Config To Avoid

- Do not inspect or modify `.env`, `.env.local`, `.env.docker`, `.env.deploy`, deployment credentials, signing files, certificates, or local machine settings.
- `.env.docker.example`, `web/triad-web/.env.example`, and `scripts/deploy/deploy.env.example` are templates and can be documented carefully without real values.
- `.claude/settings.local.json` is local Claude permission config, not project guidance.

## Tool-Specific AI Config

- Shared guidance lives in root `AGENTS.md`.
- `CLAUDE.md` is intentionally a short Claude entrypoint that points back to `AGENTS.md` and `docs/ai/*`.
- `.claude/settings.local.json` exists locally for Claude permissions and should not be edited as shared documentation.
- No shared Cursor, Copilot, Codex, or Augment config was found in the current scan.

## Test Locations

- Unit tests: `tests/ThirdWheel.API.UnitTests`.
- Integration tests: `tests/ThirdWheel.API.IntegrationTests`.
- Shared test helpers: `tests/ThirdWheel.API.TestCommon`.
- No dedicated web/iOS test suites were found in the current scan.

## Script Locations

- Setup: `scripts/setup/check-system.sh`.
- Backend test runner: `scripts/run/test-backend.sh`.
- Docker helper: `scripts/docker.sh` and `scripts/docker/docker.sh`.
- iOS run helper: `scripts/mobile/run-ios.sh`.
- Android run helper: `scripts/mobile/run-android.sh`.
- Quick local build/deploy: `scripts/run/quick-build-deploy.sh` (supports `--ios` and `--android` alongside the web/admin/business/site/backend flags).
- Seed demo data: `seed.ps1`.

## Deployment Locations

- Local compose: `docker-compose.yml`.
- Backend container: `backend/ThirdWheel.API/Dockerfile`, `scripts/deploy/backend-api.sh`.
- Consumer web container: `web/triad-web/Dockerfile`.
- Marketing site container: `web/triad-site/Dockerfile`.
- Business portal container: `web/triad-business/Dockerfile`.
- Admin container: `admin/Dockerfile`.
- Vercel deploy: `scripts/deploy/web-app.sh`, `scripts/deploy/business-app.sh`, `scripts/deploy/admin-app.sh`.
- Android deploy (debug or release APK + AAB, plus optional release hook): `scripts/deploy/android-app.sh`.
- Full deploy coordinator: `scripts/deploy/deploy.sh` (supports `--android` and `--all`).
