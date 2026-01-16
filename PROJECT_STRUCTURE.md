# Project Folder Structure

This project is built with **Next.js 15+ (App Router)** and **Supabase**. Below is an overview of how the codebase is organized.

## Core Directories

### 📂 `app/`
Contains the application's routes and pages using the Next.js App Router.
- **`app/auth/`**: Authentication-related pages (login, registration, password updates).
- **`app/dashboard/`**: The main application interface.
  - **`funders/`**: Management of funding entities.
  - **`trade/`**: Trading-related modules (history, ongoing trades).
  - **`trading-accounts/`**: Sub-modules for `credentials`, `funder-accounts`, and `user-accounts`.
  - **`trading-units/`**: Management of units used in trading.
- **`app/api/`**: Backend API routes (if any).

### 📂 `components/`
Reusable UI components.
- **`components/ui/`**: Low-level UI primitives (buttons, inputs, cards) powered by **shadcn/ui**.
- **`components/tables/`**: Data-dense table views.
- **`components/card/`**: Real-time interactive card grids (e.g., `UnitsRealtime.tsx`, `CardUnit.tsx`).
- **`components/modal/`**: confirmation dialogs and forms (e.g., `ArchieveUniit.tsx`).
- **`components/form/`**: Multi-purpose form components (e.g., `FunderForm.tsx`).
- **`components/skeleton/`**: Custom loading placeholders (e.g., `UnitSkeleton.tsx`).
- **`components/layout/`**: Global layout elements like the `DashboardSidebar`.

### 📂 `helper/`
The data access layer. These files contain asynchronous functions that interact directly with the **Supabase** client.
- Functions are typically named `get[Entity]`, `create[Entity]`, `update[Entity]`, etc.
- Example: `helper/funders.ts` handles all CRUD operations for the `funders` table.

### 📂 `lib/`
Shared utility functions and configuration.
- **`lib/supabase/`**: Configuration for the Supabase client (both server and browser versions).
- **`utils.ts`**: Common helper functions (e.g., class merging for Tailwind).

### 📂 `types/`
TypeScript interfaces and type definitions used throughout the project.
- Ensures type safety across the application.
- Example: `types/funder.ts` defines the structure of a Funder object.

### 📂 `data/`
Static data or configuration files used for seeding or reference.

---

## Technical Stack
- **Framework**: [Next.js](https://nextjs.org/)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Data Flow Pattern
1. **Database**: Supabase tables (defined in `db.sql`).
2. **Helpers**: `helper/*.ts` contain Server Actions/Functions for fetching (GET) and mutating (UPDATE/CREATE/ARCHIVE) data.
3. **Pages**: `app/**/page.tsx` (Server Components) perform initial data fetching to prevent layout shift.
4. **Interactive Components**:
   - **Static/Table**: UI components receive data as props.
   - **Real-time/Card**: Client components use `createClient` from `@/lib/supabase/client` to subscribe to `postgres_changes`, keeping the UI in sync with the database automatically.
5. **Modals**: Complex interactions (like archiving or status changes) are handled via Shadcn Dialog components and server actions.
