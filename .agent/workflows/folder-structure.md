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

## 2. Data Fetching & Real-time Pattern
Always use the `helper/` directory for database interactions.
- **Server Side**: Fetch initial data in `page.tsx`.
- **Interactivity**: Use Client Components for real-time dashboards.
- **Real-time**: Subscribe to `supabase.channel` in `useEffect` within client-side "Container" components (e.g., `UnitsRealtime.tsx`).

## 3. UI Components
- **General UI**: Add to `components/ui/` via shadcn.
- **Data Views**: 
    - Use `components/tables/` for density.
    - Use `components/card/` for interactive, status-driven modules.
- **Interactions**: Use `components/modal/` for complex actions (Archive, Status Change) to keep views decluttered.
- **Loading States**: Add specific placeholders to `components/skeleton/`.

## 4. Type Safety
Define all interfaces in `types/`. Do not use `any` unless absolutely necessary.

// turbo
## 5. Directory Mapping
- `app/`: Routing
- `components/`: UI
- `helper/`: Supabase Logic
- `types/`: TS Definitions
- `lib/`: Utilities
