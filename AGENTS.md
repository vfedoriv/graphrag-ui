# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React TypeScript frontend for a future GraphRAG admin/dashboard UI. Application code lives in `src/`: `main.tsx` mounts React, `App.tsx` contains the current root component, and `App.css` / `index.css` hold styles. Static public assets live in `public/`; imported UI assets live in `src/assets/`. Build and tool configuration is at the repository root (`vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`). `PROJECT_IDEA.md` describes the intended product direction and backend relationship.

## Build, Test, and Development Commands

Use npm scripts from the repository root:

- `npm run dev` starts the Vite development server with HMR.
- `npm run build` runs TypeScript project build checks and creates the production Vite bundle in `dist/`.
- `npm run lint` runs ESLint over the project.
- `npm run preview` serves the production build locally for verification.

Install dependencies with `npm install` when `package-lock.json` changes.

## Coding Style & Naming Conventions

Write TypeScript and React components in `.tsx` files. Follow the existing style: two-space indentation, single quotes, no semicolons, and function components. Prefer descriptive component and variable names; use `PascalCase` for React components, `camelCase` for variables/functions, and lowercase or kebab-case for static asset filenames. Keep component-specific styles near the component unless a rule is truly global. Run `npm run lint` before submitting changes.

## Testing Guidelines

No test runner is currently wired in `package.json`. When adding tests, prefer Vitest to match the project plan, place tests beside the code as `*.test.ts` or `*.test.tsx`, and add an `npm test` script. Focus tests on user-visible dashboard behavior, API client transformations, and state transitions rather than implementation details.

## Commit & Pull Request Guidelines

The existing history uses short imperative commit messages, for example `add project idea` and `init commit`. Continue that style with focused commits such as `add knowledge base list view`. Pull requests should include a concise summary, testing performed (`npm run build`, `npm run lint`, future `npm test`), linked issues when applicable, and screenshots or screen recordings for UI changes.

## Security & Configuration Tips

Do not commit secrets, backend tokens, or local environment files. Keep backend URLs and runtime configuration in environment variables when introduced. Authentication and authorization are currently out of scope per `PROJECT_IDEA.md`, so avoid adding placeholder security flows without a product decision.
