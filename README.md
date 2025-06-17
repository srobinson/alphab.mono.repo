# alphab.mono.repo

A modern, cross-language monorepo for the Alphab platform, featuring:

- **Web apps** (React/TypeScript)
- **APIs** (Python/FastAPI)
- **Database tooling** (Supabase, migrations, scripts)
- **Shared packages** (TypeScript, Python)

## Monorepo Structure

```
.
├── apps
│   ├── gallery-web         # Next-gen gallery web app (React, Vite, Tailwind)`
│   ├── particle0-api       # Python FastAPI backend for Particle0
│   └── particle0-web       # Particle0 web frontend
├── packages
│   ├── alphab-db-migrations  # DB migration framework (TypeScript)
│   ├── alphab-db-scripts     # DB migration/utility scripts
│   ├── alphab-db-supabase    # Supabase DB helpers, schema, migrations
│   ├── alphab-env-config     # Shared env config loader
│   ├── alphab-http-client    # Python HTTP client
│   ├── alphab-http-client-ui # TypeScript HTTP client
│   ├── alphab-logging        # Python logging
│   ├── alphab-logging-ui     # TypeScript logging
│   ├── alphab-logto          # Python Logto integration
│   ├── alphab-logto-ui       # TypeScript Logto integration
│   ├── alphab-scripts        # Dev/build scripts
│   └── ...                   # More shared packages
├── _supabase                # Supabase config & migrations
├── DOCS                     # Architecture, database, and dev docs
├── scripts                  # Utility scripts
├── TMP                      # Temporary/migration files
└── ...
```

## Key Apps & Packages

- **apps/gallery-web**: Modern gallery app (React, Vite, Tailwind)
- **apps/particle0-api**: Python FastAPI backend
- **apps/particle0-web**: Particle0 web frontend
- **packages/alphab-db-supabase**: Supabase schema, helpers, migrations
- **packages/alphab-db-migrations**: Migration framework (multi-DB, versioned)
- **packages/alphab-db-scripts**: CLI/database scripts
- **\_supabase**: Supabase config, raw SQL migrations

## Quickstart

1. **Install dependencies** (requires [pnpm](https://pnpm.io/)):
   ```sh
   pnpm install
   ```
2. **Set up environment variables**:
   - Copy `.env.example` files from relevant packages/apps and fill in secrets.
3. **Run Supabase locally** (if needed):
   ```sh
   cd _supabase
   # Follow Supabase docs for local dev
   ```
4. **Start a web app** (e.g. gallery):
   ```sh
   cd apps/gallery-web
   pnpm dev
   ```
5. **Run backend API**:
   ```sh
   cd apps/particle0-api
   # e.g. poetry install && poetry run uvicorn particle0.main:app --reload
   ```
6. **Run migrations**:
   ```sh
   pnpm --filter alphab-db-migrations run migrate
   # or use scripts in packages/alphab-db-scripts
   ```

## Contributing

- See individual package/app `README.md` for details.
- Use `pnpm` for all JS/TS package management.
- Python packages use `poetry`.
- See `DOCS/` for architecture, database, and dev guides.

## Documentation

- [DOCS/](./DOCS/) — architecture, database, and dev docs
- [apps/gallery-web/README.md](./apps/gallery-web/README.md)
- [apps/particle0-api/README.md](./apps/particle0-api/README.md)
- [packages/alphab-db-supabase/README.md](./packages/alphab-db-supabase/README.md)
- [packages/alphab-db-migrations/README.md](./packages/alphab-db-migrations/README.md)

---

**alphab.mono.repo** — Unified platform for modern, composable, cross-language development.
