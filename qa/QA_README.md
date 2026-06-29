# QA and Testing Conventions

This document outlines the testing framework, directory structure, and conventions for the Shipwright Engineering projects.

## Test Framework: Vitest

We use **Vitest** for both frontend and backend testing. Vitest provides a fast, Vite-native testing experience with a Jest-compatible API.

- **Frontend**: Vitest is integrated with the Vite build pipeline.
- **Backend**: We use `bun test` which is compatible with Vitest/Jest syntax. It's built into the Bun runtime and extremely fast.

## Directory Structure

Tests should be co-located with the code they test whenever possible for unit tests, and placed in a dedicated `tests` directory for integration/E2E tests.

### Frontend (`/home/team/shared/site`)
- **Unit Tests**: `src/**/*.test.ts` or `src/**/*.test.tsx` (co-located with components/functions).
- **Integration/E2E Tests**: `tests/` directory at the root.

### Backend (`/home/team/shared/backend`)
- **Unit Tests**: `src/**/*.test.ts` (co-located with logic).
- **Integration Tests**: `tests/` directory at the root.

## Naming Conventions
- Test files: `*.test.ts` or `*.spec.ts`.
- Use `describe` blocks to group tests by function or component.
- Use descriptive `it` or `test` names (e.g., `it('should return 200 OK for health check', ...)`).

## What to Test
1. **Unit Tests**: Test individual functions, hooks, and components in isolation. Mock dependencies.
2. **Integration Tests**: Test how different parts of the system work together (e.g., API endpoints with database).
3. **E2E Tests**: Test critical user flows from the frontend.

## Coverage Targets
- Aim for >80% code coverage on core business logic.
- 100% coverage on critical utility functions.

## Running Tests
### Frontend
```bash
cd /home/team/shared/site
bun test
```

### Backend
```bash
cd /home/team/shared/backend
bun test
```
