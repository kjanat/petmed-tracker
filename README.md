# PetMed Tracker

**PetMed Tracker** is your all-in-one, mobile-first solution for managing every aspect of your pets' health and daily care. Designed for modern pet owners, families, and caregivers, it empowers you to:

- **Never miss a medication or feeding:** Schedule, track, and log every dose, meal, and supplement for each pet.
- **Share care with confidence:** Instantly share up-to-date care instructions, medication lists, and emergency info with family, sitters, or vets using secure QR codes.
- **Access anywhere, anytime:** Works offline as a PWA, so you’re always in control—even without internet.
- **Stay organized and proactive:** Get reminders, see care history, and keep all your pets’ vital info in one place.

Built with privacy, reliability, and ease-of-use at its core, PetMed Tracker is the ultimate digital companion for responsible pet care—whether you have one pet or a whole menagerie.

<a href="https://codecov.io/gh/kjanat/petmed-tracker" >
<img src="https://codecov.io/gh/kjanat/petmed-tracker/graph/badge.svg?token=6Xrr3mJr5P" alt="Codecov coverage badge showing current test coverage percentage for the PetMed Tracker repository"/>
</a>

## Features

- Manage pets, medications, food schedules, and caregivers
- QR code system for emergency access and sharing
- Discord OAuth authentication
- PWA support for offline use and home screen install
- End-to-end type safety with TRPC
- SQLite database (dev) via Prisma

## Quick Start

```bash
bun install
bun run db:generate
bun run dev
```

## PWA Installation Logic

The `PWAInstaller` component registers the service worker and listens for the
`beforeinstallprompt` event so the install banner can be shown at the right
time. When a user dismisses the banner, their choice is stored in `localStorage`
to prevent nagging. Once installed or dismissed, the prompt won't reappear until
the appropriate conditions are met.

## Project Stack

- Next.js 15 (App Router, Turbo)
- TRPC, React Query
- Prisma ORM (SQLite by default)
- NextAuth v5 (Discord OAuth)
- Tailwind CSS
- Bun (package manager & scripts)

## Directory Structure

<!-- tree -L 3 --gitignore -I node_modules -->

```tree
.
├── .env
├── .gitignore
├── biome.jsonc
├── bun.lock
├── next.config.js
├── package.json
├── postcss.config.mjs
├── prisma
│   ├── db.sqlite
│   └── schema.prisma
├── public
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-192.svg
│   ├── icon-512.png
│   ├── icon-512.svg
│   ├── manifest.json
│   ├── offline.html
│   ├── sw.js
│   └── sw.ts
├── README.md
├── src
│   ├── app
│   │   ├── api
│   │   ├── _components
│   │   ├── home.tsx
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── pets
│   │   ├── profile
│   │   ├── qr
│   │   └── qr-scanner
│   ├── components
│   │   ├── MobileLayout.tsx
│   │   └── PWAInstaller.tsx
│   ├── env.js
│   ├── server
│   │   ├── api
│   │   ├── auth
│   │   └── db.ts
│   ├── styles
│   │   └── globals.css
│   └── trpc
│       ├── query-client.ts
│       ├── react.tsx
│       └── server.ts
└── tsconfig.json
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md)

## License

This project is licensed under the GNU Affero General Public License v3.0. See the [LICENSE](LICENSE) file for details.

<!-- ## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information. -->

<!-- markdownlint-configure-file
{
  "no-inline-html": false
}
-->
