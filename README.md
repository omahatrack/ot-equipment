# OTE Equipment Hub v32

GoDaddy production startup fix.

- Preserves v31 production-build validation/self-healing.
- Uses configured `SESSION_SECRET` when present.
- If GoDaddy production omits `SESSION_SECRET`, startup generates a cryptographically strong runtime secret before database/build/server startup so the site remains healthy.
- A permanent GoDaddy `SESSION_SECRET` is still recommended so signed-in sessions survive restarts/deployments.


## v34
- Added quick machine-hours update from Equipment Detail for Admins and Mechanics.
- Hour updates create MachineHoursLog history entries.
- Needed Service now treats equipment within 100 hours of its next hours-based service as Due Soon.
- Calendar-based advance warning remains 30 days.


## v35 deployment cache hardening
- Prevents authenticated App Router HTML/RSC responses from being cached across deployments.
- Adds explicit no-store/no-cache headers and App Router Vary headers in middleware.
- No database migration required.


## v38
Supabase Storage now uses `SUPABASE_SECRET_KEY` (`sb_secret_...`) for server-side access. Legacy `SUPABASE_SERVICE_ROLE_KEY` remains supported as a fallback. New secret keys are sent in the `apikey` header rather than as a Bearer JWT.

## v46 GoDaddy dependency hardening
- Runtime packages `mariadb`, `nodemailer`, `@prisma/adapter-mariadb`, and `@prisma/client` remain explicit production dependencies.
- Added a `prebuild` dependency check that automatically runs a production `npm install` if GoDaddy's cached build environment is missing any required runtime package.
- The Prisma client used by the application is already generated and committed under `src/generated/prisma`, so deployment does not depend on a separate Prisma generation step.
