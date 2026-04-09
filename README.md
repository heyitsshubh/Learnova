# Learnova (learnOva)

**Learnova** is a modern **Learning Management System (LMS)** / digital classroom platform built with **Next.js**.  
It provides tools for students and teachers to manage classes, collaborate, and streamline learning workflows in a clean, responsive UI.

---

## Table of Contents
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API / Backend](#api--backend)
- [Authentication](#authentication)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### 1) Authentication & Accounts
- **Email + Password login/signup**
- **Google OAuth sign-in** using Firebase Authentication
- Token-based login state (access + refresh tokens stored client-side)
- Forgot-password navigation flow (UI hook present)

### 2) Dashboard Experience
- A dashboard layout with reusable UI components:
  - **Stats cards**
  - **Calendar widget**
  - **To-do list widget** (client UI)
- Responsive layout using app-level wrappers (sidebar + main content wrapper)

### 3) Classroom Management (Core LMS)
- Create a classroom with:
  - Class name
  - Subject
  - Privacy (public/private)
- Join classes via **class code**
- View:
  - **Joined classes**
  - **Created classes**
- Leave class
- Delete class
- View classmates / participants list for a class

### 4) Assignments
- Teachers can create assignments with:
  - Title + description
  - Due date selection
  - **File attachment upload**
- Basic validation + user feedback with toast notifications

### 5) Class Tools Menu (Teacher Utilities)
A classroom quick menu includes actions like:
- Attendance (entry present)
- Schedule meet (action hook present)
- Create assignment
- Make announcements

### 6) Real-time / Live UX Foundations
- `SocketProvider` included in the app layout (foundation for real-time features like chat, live updates, announcements, etc.)
- `react-hot-toast` integrated for consistent user feedback

### 7) Community / Notifications / Settings Pages (Product Shell)
- Sidebar routes include:
  - Home (Dashboard)
  - Classroom
  - Community
  - Notifications
  - Settings
- Settings UI includes:
  - Theme-aware styling (light/dark mode support via `ThemeProvider`)
  - Profile card UI
  - Change password modal entry (UI wiring exists)

### 8) Marketing / Landing Page
- Landing page with:
  - Hero section
  - Features section (product positioning like video conferencing, assignments, cloud library, analytics, chat, mobile-ready)
  - FAQ section
  - Footer

---

## Screenshots
Add screenshots/gifs here (recommended):
- Landing page
- Dashboard
- Classroom list
- Classroom details + classmates
- Create assignment modal

Example:
- `public/screenshots/dashboard.png`
- `public/screenshots/classroom.png`

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- Tailwind CSS (with utilities like `clsx`, `tailwind-merge`)
- Animations: `framer-motion`, `react-awesome-reveal`
- Charts: `recharts`
- Icons: `react-icons`, `lucide-react`

### Auth
- **Firebase Authentication** (Google provider)

### Real-time / Media
- `socket.io-client` (real-time foundation)
- `mediasoup-client` (real-time media foundation; useful for live classes/video)

### HTTP
- `axios`

---

## Project Structure (high level)

- `app/` — Next.js app router pages + components
  - `app/Components/` — UI components grouped by domain (Auth, Dashboard, Classroom, LandingPage, etc.)
  - `app/services/` — API service functions (classroom, auth, assignment, etc.)
  - `app/utils/` — tokens, firebase config, helpers
  - `app/lib/` — axios instance & shared client libs

---

## Getting Started

### 1) Install dependencies
```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### 2) Run the dev server
```bash
npm run dev
```

Open:
- http://localhost:3000

### 3) Build for production
```bash
npm run build
npm run start
```

---

## Environment Variables

### Important
Your repo currently contains Firebase client config in code. For production, it’s best to move these to environment variables.

Create `.env.local`:
```bash
# Example (adjust based on your backend + firebase setup)
NEXT_PUBLIC_API_BASE_URL=https://api.heyitsshubh.me

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

---

## API / Backend

Learnova uses a backend API for classroom operations (and likely auth/assignments).  
Examples of API endpoints used by the frontend:
- Classroom base: `https://api.heyitsshubh.me/api/class/`
- Join by code: `/api/class/join-by-code`
- Class listing: `/api/class/all?userId=...&filter=joined|created`
- Classmates: `/api/class/classmates/:classId`
- Leave class: `/api/class/leave`

> If you want, I can add a clean “Backend setup” section once you share the backend repo or describe the endpoints.

---

## Authentication

Supported auth flows:
- Email/password login + signup
- Google sign-in with Firebase popup flow
- Token storage utilities used to persist session

---

## Roadmap (suggested)
- [ ] Real-time classroom chat powered by sockets
- [ ] Announcements feed per class
- [ ] Attendance tracking workflow
- [ ] Assignment submissions + grading pipeline
- [ ] Notifications system (backend + UI)
- [ ] Instructor/admin dashboards & analytics (charts already supported)
- [ ] File storage integration (S3/Cloudinary/Firebase Storage) + permissions
- [ ] Role-based access (Student / Teacher / Admin)

---

## Contributing
Contributions are welcome!

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License
Add a license file (MIT/Apache-2.0/etc.) or remove this section if not needed.

---

### Maintainer
- **@heyitsshubh**
