# FindIT Frontend

FindIT is the PSG Tech lost-and-found platform. This frontend provides the student-facing experience for reporting lost items, posting found items, browsing the latest activity, and accessing the authenticated dashboard.

## What this app does

- Lets users report items they lost or found
- Provides a landing page with quick actions and recent activity
- Supports sign-in and a protected dashboard
- Connects to the backend API for profile and item data
- Uses a modern React + TypeScript UI built with Vite, Tailwind CSS, and shadcn/ui

## Pages

- `/` Home and reporting entry point
- `/login` Authentication screen
- `/about` Project overview
- `/dashboard` Personal dashboard for signed-in users

## Local setup

```sh
npm install
npm run dev
```

By default, the app runs on the Vite dev server. Make sure the backend API is running as well so login and dashboard requests can succeed.

## Project structure

- `src/pages` contains the main routed pages
- `src/components` contains reusable UI and forms
- `src/components/ui` contains the shadcn/ui primitives
- `src/hooks` contains shared React hooks
- `src/lib` contains shared utility helpers

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query

## Notes

The frontend is designed to work with the Express and MongoDB backend in the parent project. Authentication uses a token stored in local storage, and dashboard requests are sent to the backend API on `http://localhost:8080`.
