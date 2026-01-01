# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daily Focus Dashboard - A task and time management React application with calendar views, project tracking, and dashboard analytics.

## Common Commands

```bash
npm run dev          # Start dev server (Vite at http://localhost:8080)
npm run build        # Production build
npm run build:dev    # Development build with source maps
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

**Note:** No test runner is configured. Backend API expected at http://localhost:3000.

## Tech Stack

- **React 18** with TypeScript and Vite
- **State Management:** React Context (TaskContext) + TanStack React Query
- **UI:** shadcn/ui (Radix) + Tailwind CSS + Framer Motion
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router DOM v6

## Architecture

### Data Flow

```
API (localhost:3000) → Services → Hooks → Context/Components → UI
```

### Directory Structure

- `src/components/ui/` - shadcn/ui primitives
- `src/components/{domain}/` - Feature components (dashboard, calendar, tasks)
- `src/pages/` - Route page components
- `src/hooks/` - Custom hooks (useTasks, useDashboard)
- `src/context/` - React Context providers (TaskContext)
- `src/services/` - API service layer (task.service, dashboard.service)
- `src/types/` - TypeScript interfaces

### Key Patterns

**Service Layer:** Wraps API calls in dedicated service files

```typescript
export const taskService = {
  getAll: async () => {
    /* ... */
  },
  create: async (data) => {
    /* ... */
  },
  update: async (id, data) => {
    /* ... */
  },
  delete: async (id) => {
    /* ... */
  },
};
```

**Hooks Pattern:** Encapsulates state and API logic

```typescript
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  // Returns { tasks, loading, fetchTasks, addTask, updateTask, deleteTask }
};
```

**Optimistic Updates:** UI updates immediately, rolls back on API error

### API Endpoints (Backend)

- `GET/POST /tasks` - Task CRUD
- `GET /tasks/calendar` - Date range queries
- `PATCH/DELETE /tasks/:id` - Task updates
- `GET /dashboard/summary` - Dashboard data
- `POST /projects` - Project creation

## Conventions

- All components are functional with hooks (no classes)
- Use `forwardRef` for components that need DOM access
- Tailwind for styling with custom colors defined in config
- Sonner toasts for user feedback
- Import alias: `@/*` maps to `src/*`

## Routes

- `/` - Dashboard
- `/tasks` - Task list
- `/calendar` - Calendar view
- `/projects` - Projects page

## Development Rules

### General

- Update existing docs (Markdown files) in `./docs` directory before any code refactoring
- Add new docs (Markdown files) to `./docs` directory after new feature implementation (do not create duplicated docs)
- use `senera` mcp tools for semantic retrieval and editing capabilities
- whenever you want to see the whole code base, use this command: `repomix` and read the output summary file.

### Environment Setup

- Use docker compose for development environment

### Code Quality Guidelines

- Don't be too harsh on code linting and formatting
- Prioritize functionality and readability over strict style enforcement
- Use reasonable code quality standards that enhance developer productivity
- Allow for minor style variations when they improve code clarity

### Pre-commit/Push Rules

- Keep commits focused on the actual code changes
- **DO NOT** commit and push any confidential information (such as dotenv files, API keys, database credentials, etc.) to git repository!
- NEVER automatically add AI attribution signatures like:
  "🤖 Generated with [Claude Code]"
  "Co-Authored-By: Claude noreply@anthropic.com"
  Any AI tool attribution or signature
- Create clean, professional commit messages without AI references. Use conventional commit format.
