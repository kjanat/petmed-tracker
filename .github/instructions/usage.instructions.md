---
applyTo: '**'
---

# PetMed Tracker Usage Instructions

This document provides step-by-step instructions for setting up, developing, and deploying the PetMed Tracker application powered by Next.js, TRPC, Prisma, NextAuth v5, Tailwind CSS, and Bun.

---

## Prerequisites

- **Bun** (v1.2.x or later) installed globally: [https://bun.sh/](https://bun.sh/)
- **Node.js** (v18+ recommended for compatibility)
- **Git** for repository cloning
- A `.env` file at the project root containing the following keys:

  ```dotenv
  # NextAuth
  AUTH_SECRET="<your-auth-secret>"

  # Discord OAuth (if using Discord provider)
  AUTH_DISCORD_ID="<discord-client-id>"
  AUTH_DISCORD_SECRET="<discord-client-secret>"

  # Prisma
  DATABASE_URL="file:./db.sqlite"
  ```

---

## Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/kjanat/petmed-tracker.git
   cd petmed-tracker
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Generate Prisma Client**

   ```bash
   bun run db:generate
   ```

4. **Initialize environment**
   - Ensure your `.env` file is present and values are correct.
   - The `src/env.js` file uses `@t3-oss/env-nextjs` and Zod to validate server env vars.

---

## Development

- **Start the dev server**

  ```bash
  bun run dev
  ```

  Runs `next dev --turbo`. Access at [http://localhost:3000](http://localhost:3000) (or next free port).

- **Type checking**

  ```bash
  bun run typecheck
  ```

  Runs `tsc --noEmit` to validate TypeScript types.

- **Linting**

  ```bash
  bun run check
  ```

  Uses Biome (configured in `biome.jsonc`) to check code style.

---

## Database & Prisma

- **Generate client**: `bun run db:generate`
- **Migrate schema** (development): `bun run db:generate` (with `prisma migrate dev` under the hood)
- **Deploy migrations** (production): `bun run db:migrate`
- **Push schema** (without migrations): `bun run db:push`
- **Studio**: `bun run db:studio` (opens Prisma Studio UI)

Schemas are defined in `prisma/schema.prisma` and output to `prisma/db.sqlite`.

---

## Authentication (NextAuth v5)

- **Config file**: `src/server/auth/config.ts`
- **Adapter**: PrismaAdapter using your `db` instance
- **Providers**: Discord OAuth configured with `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` in `.env`
- **Callbacks**: Custom session callback that injects `user.id` into session
- **Exports**: `auth`, `handlers`, `signIn`, `signOut` from `src/server/auth/config.ts`

In `src/server/api/trpc.ts`, `auth()` is used to populate `session` in TRPC context.

---

## Configuration Files Overview

- **next.config.js**: Next.js configuration (framework, transpilation)
- **tsconfig.json**: TypeScript compiler options and path aliases
- **postcss.config.js** + **tailwind.config.js**: Tailwind CSS setup
- **biome.jsonc**: Biome linting rules
- **prisma/schema.prisma**: Database schema and generators
- **src/env.js**: Zod schema and environment variable validation
- **src/server/db.ts**: Prisma client export
- **.env**: Local environment variables (not committed)

---

## Production & Preview

- **Build**

  ```bash
  bun run build
  ```

  Runs `next build`.

- **Preview**

  ```bash
  bun run preview
  ```

  Builds and starts `next start`.

- **Start**

  ```bash
  bun run start
  ```

  Runs `next start` on built assets.

---

## Tips & Best Practices

- Always keep your `.env` in sync with `src/env.js` validation schema.
- Use `bun run check:write` to auto-fix minor code style issues.
- For new providers, follow NextAuth v5 docs: [https://next-auth.js.org/providers](https://next-auth.js.org/providers)
- Keep Prisma migrations and schema in version control for reproducibility.
- Utilize TRPC for end-to-end type safety between backend and frontend.
