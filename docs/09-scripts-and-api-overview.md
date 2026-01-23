# Scripts & API Overview

## Scripts

### Backend Scripts

- pnpm run dev  
  Starts the backend server in development mode.

- pnpm run lint  
  Runs ESLint to find code issues.

- pnpm run format  
  Formats the code using Prettier.

- pnpm run format:check  
  Verifies formatting without changing files.

- pnpm run typecheck  
  Runs TypeScript type checking.

---

## API Overview

This backend exposes REST APIs.

### System APIs

- GET /health  
  Health check endpoint.

### Test APIs

- GET /async-crash  
  Endpoint to test async error handling.

Future APIs will be added in upcoming milestones.
