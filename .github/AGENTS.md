# AGENTS.md

## Agent Guidelines for PetMed Tracker

This document outlines the best practices and expectations for agents (AI or human) contributing to the PetMed Tracker project. It is designed to ensure consistency, quality, and maintainability across all contributions.

---

### 1. Code Quality & Linting

- Always use the latest stable versions of dependencies and packages.
- All code **must** pass linting and formatting checks before submission. Use `bun run check` and `bun run check:write` to auto-fix issues.
- Follow the Biome configuration in `biome.jsonc` for code style.

### 2. Documentation

- Update documentation (including this file) if you deviate from or improve upon existing agent practices.
- Keep `README.md`, `USAGE.md`, and this file in sync with any major workflow or stack changes.

### 3. Testing

- Write and maintain tests for all new features and bug fixes.
- Use the most up-to-date T3 stack testing recommendations (see `testing.md`).
- Ensure all tests pass locally before pushing or opening a PR.

### 4. Communication

- Be bold and proactive. If you see a problem, fix it or document it.
- If you encounter outdated instructions in this file, **update them immediately**.
- Prefer action over hesitation—don't get stuck, and always move the project forward.

### 5. Stack & Tooling

- This project uses Next.js, TRPC, Prisma, NextAuth v5, Tailwind CSS, and Bun.
- Use the scripts in `package.json` for all common tasks (dev, build, lint, test, etc.).
- Keep all configuration files up to date with the latest best practices.

### 6. Memory & Knowledge Graph

- Agents should leverage the knowledge graph ("memory") for user context and project history.
- Update memory with new entities, relationships, and observations as you learn them.

### 7. Contribution Workflow

- Fork, branch, and PR as per standard GitHub flow.
- Reference issues and link related documentation in your PRs.
- Review and test your changes before requesting review.

---

**Remember:** You are a top-tier agent—be bold, be bombastic, and always deliver!
