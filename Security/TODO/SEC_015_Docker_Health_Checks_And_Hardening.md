# SEC_015 — Docker Compose Health Checks and Container Hardening

**Severity:** MEDIUM  
**SOC 2 Criteria:** CC7.1, A1.1  
**Status:** Open  
**Effort:** Small (half day)

---

## Problem

`docker-compose.yml` does not define health checks for any service containers. The API has a `/health` endpoint but it is not wired into Docker's health check mechanism. Additionally, container security hardening controls are absent.

**Current gaps:**

1. No `healthcheck` directives in any service definition.
2. No memory or CPU limits on containers.
3. No read-only root filesystem (`read_only: true`).
4. No user namespace remapping (containers may run as root).
5. No container image vulnerability scanning in the build process.

## Fix

### 1. Health Checks

Add `healthcheck` to the `api` service and any web services that expose HTTP:

```yaml
# docker-compose.yml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 3. Non-Root User in Dockerfile

```dockerfile
# backend/ThirdWheel.API/Dockerfile
# Add before ENTRYPOINT
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser
```

### 4. Read-Only Filesystem (Where Possible)

For services that do not write to disk (web, admin, business):

```yaml
services:
  web:
    read_only: true
    tmpfs:
      - /tmp
```

The `api` service writes to `uploads/` so it cannot be fully read-only, but the root filesystem outside the volume can be.

### 5. Image Vulnerability Scanning

Add a pre-build scan step using `trivy` or `docker scout`:

```bash
# In scripts/deploy/backend-api.sh
trivy image --exit-code 1 --severity HIGH,CRITICAL $IMAGE_NAME
```

## Files To Edit

- `docker-compose.yml` — add healthcheck, resource limits
- `backend/ThirdWheel.API/Dockerfile` — add non-root user
- `web/triad-web/Dockerfile` — add non-root user, read-only option
- `web/triad-business/Dockerfile` — add non-root user
- `scripts/deploy/backend-api.sh` — add trivy scan step

## Fix Prompt

```
In docker-compose.yml, for the api service add:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits: { cpus: '2.0', memory: 1G }
        reservations: { cpus: '0.5', memory: 256M }

For web/admin/business services that expose HTTP, add:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3

In backend/ThirdWheel.API/Dockerfile, just before the ENTRYPOINT line:
    RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
    USER appuser

Apply the same non-root USER pattern to web/triad-web/Dockerfile and web/triad-business/Dockerfile.

In scripts/deploy/backend-api.sh, before the docker push step:
    trivy image --exit-code 1 --severity HIGH,CRITICAL "$IMAGE_NAME"
```
