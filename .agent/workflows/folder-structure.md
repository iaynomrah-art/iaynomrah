---
description: Overview of the project folder structure and development patterns
---

# Project Structure Workflow

This workflow explains the architectural patterns used in this project. Use this as a reference when adding new features or modifying existing ones.

## 1. Adding a New Route
When adding a new feature (e.g., "Settings"):
1. Create a folder in `app/dashboard/settings/`.
2. Add a `page.tsx` for the main view.
3. If the page needs data, create a helper in `helper/settings.ts`.

## 2. Data Fetching Pattern
Always use the `helper/` directory for database interactions.
- **Server Side**: Use `helper` functions in `page.tsx`.
- **Client Side**: For real-time updates or complex filtering, pass the initial data from the Page to a Client Component.

## 3. UI Components
- **General UI**: Add to `components/ui/` using shadcn CLI.
- **Specific Tables**: Add to `components/tables/` to keep page logic clean.
- **Layouts**: Use `app/dashboard/layout.tsx` for persistent UI like sidebars.

## 4. Type Safety
Define all interfaces in `types/`. Do not use `any` unless absolutely necessary.

// turbo
## 5. Directory Mapping
- `app/`: Routing
- `components/`: UI
- `helper/`: Supabase Logic
- `types/`: TS Definitions
- `lib/`: Utilities
