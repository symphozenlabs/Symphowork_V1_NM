# Environment

Server-only values are never prefixed with `NEXT_PUBLIC_`. `src/config/env.ts` validates the complete runtime configuration at import time. Only `NEXT_PUBLIC_APP_NAME` is browser-safe in the initial foundation.

The storage, email, AI, and Redis settings describe provider boundaries. No vendor SDK or secret is wired into the product yet. Production deployment should configure these values through Vercel environment settings and use a managed Neon-compatible PostgreSQL database.
