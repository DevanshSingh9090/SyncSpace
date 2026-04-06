# SyncSpace — MERN Stack Project Management App

A full-stack project management application built with **MongoDB, Express, React (Vite + JS), Node.js** and **Redux Toolkit**.

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **MongoDB + Mongoose** — Database
- **JWT** — Authentication & session tokens
- **bcrypt** — Password hashing
- **Nodemailer + Gmail SMTP** — Transactional email (verification, invites, password reset, 2FA OTP)
- **Cloudinary** — Avatar image uploads
- **Arcjet** — Rate limiting, bot detection, email validation & shield protection
- **Zod + zod-express-middleware** — Schema validation
- **Morgan** — HTTP request logging

### Frontend
- **React 18 + Vite** — UI framework (JavaScript, no TypeScript)
- **Redux Toolkit + react-redux** — State management (`createAsyncThunk` for all API calls)
- **React Router DOM v6** — Client-side routing
- **React Hook Form + @hookform/resolvers** — Form state & Zod-based validation
- **Tailwind CSS v3 + shadcn/ui (Radix UI)** — Styling & accessible components
- **Recharts** — Charts on dashboard
- **Sonner** — Toast notifications
- **date-fns + react-day-picker** — Date formatting & date picker

> ✅ No separate `hooks/` folder — all hooks (`useSelector`, `useDispatch`, `useState`, `useEffect`) are used inline within components/pages.

---

## Project Structure

```
SyncSpace/
├── backend/
│   ├── controllers/          # auth-controller, workspace, project, task, user
│   ├── libs/                 # arcjet, cloudinary, send-email, validate-schema
│   ├── middleware/           # auth-middleware (JWT), error-handler
│   ├── models/               # user, workspace, project, task, comment, activity, audit-log, verification, workspace-invite
│   ├── routes/               # auth, workspace, project, task, user, index
│   ├── index.js              # Express server entry
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── store/
    │   │   ├── index.js                  # configureStore
    │   │   └── slices/
    │   │       ├── authSlice.js          # login, register, profile, 2FA, password
    │   │       ├── workspaceSlice.js     # CRUD + invite + accept invite + transfer ownership
    │   │       ├── projectSlice.js       # CRUD + members + fetch tasks
    │   │       └── taskSlice.js          # full task CRUD + comments + reactions + subtasks + attachments + activity
    │   ├── lib/
    │   │   ├── api.js                    # axios instance with auth interceptors
    │   │   └── utils.js                  # cn, getProjectProgress, color helpers
    │   ├── layouts/
    │   │   ├── AuthLayout.jsx
    │   │   ├── DashboardLayout.jsx
    │   │   └── UserLayout.jsx
    │   ├── components/
    │   │   ├── ui/                       # button, card, dialog, input, select, misc (tabs, checkbox, scroll-area, separator, etc.)
    │   │   ├── layout/                   # Sidebar, Header
    │   │   └── shared.jsx                # Loader, NoDataFound, BackButton
    │   └── pages/
    │       ├── auth/                     # Home, SignIn, SignUp, ForgotPassword, ResetPassword, VerifyEmail
    │       ├── dashboard/                # Dashboard (charts), MyTasks, Members, Achieved
    │       ├── workspace/                # Workspaces, WorkspaceDetails, WorkspaceInvite
    │       ├── project/                  # ProjectDetails (kanban board)
    │       ├── task/                     # TaskDetails (inline edit, subtasks, comments, reactions, attachments, activity)
    │       └── user/                     # Profile (update name/avatar, change password)
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env
```

---

## Setup & Installation

### 1. Clone the repo

```bash
git clone <repo-url>
cd SyncSpace
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values (see Environment Variables below)
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
# .env is already pre-configured → VITE_API_URL=http://localhost:5000/api-v1
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=             # MongoDB connection string
JWT_SECRET=            # Secret key for JWT signing

FRONTEND_URL=http://localhost:5173

# Email — Gmail SMTP (Nodemailer)
# 1. Enable 2-Step Verification → https://myaccount.google.com/security
# 2. Generate App Password → https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=             # 16-char app password (no spaces)
FROM_EMAIL=your@gmail.com

# Cloudinary — Avatar uploads
# Grab from https://cloudinary.com → Dashboard → API Keys
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Arcjet — Security & rate limiting
# Get key from https://arcjet.com
ARCJET_KEY=
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api-v1
```

---

## Features

- 🔐 **Auth** — Register, Login, Email Verification, Resend Verification, Forgot/Reset Password (JWT)
- 🔑 **Two-Factor Authentication (2FA)** — Enable, verify, disable TOTP-based 2FA with OTP resend
- 🏢 **Workspaces** — Create, update, delete workspaces; invite members by email link; accept invite; transfer ownership
- 📁 **Projects** — Create, update, delete projects with status/dates/tags/members and progress bar
- ✅ **Tasks** — Kanban board (To Do / In Progress / Review / Done), priority, due dates, assignees, delete task
- 📝 **Task Details** — Inline edit title/description, status/priority selectors, subtasks with progress
- 💬 **Comments** — Add comments with emoji reactions (👍 ❤️ 😂 😮 😢 🎉 🔥 👏)
- 📎 **Attachments** — Add & delete URL-based file attachments on tasks
- 📋 **Activity Log** — Full audit trail per task (created, updated, commented, attached, etc.)
- 👤 **Profile** — Update name/avatar (Cloudinary), change password, account info
- 📊 **Dashboard** — Stat cards, pie chart (task distribution), project progress bars
- 🏆 **Achieved** — View completed tasks
- 🛡️ **Security** — Arcjet rate limiting, bot detection, email validation, and shield on auth routes

---

## API Endpoints

### Auth (`/api-v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login |
| POST | `/verify-email` | Verify email with token |
| POST | `/resend-verification` | Resend verification email |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Reset password |
| POST | `/2fa/enable` | Enable 2FA 🔒 |
| POST | `/2fa/verify` | Verify 2FA OTP 🔒 |
| POST | `/2fa/disable` | Disable 2FA 🔒 |
| POST | `/2fa/resend` | Resend 2FA OTP |

### Workspaces (`/api-v1/workspaces`) — 🔒 Auth required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all user workspaces |
| POST | `/` | Create workspace |
| GET | `/:workspaceId` | Workspace details |
| PUT | `/:workspaceId` | Update workspace |
| DELETE | `/:workspaceId` | Delete workspace |
| GET | `/:workspaceId/projects` | Workspace projects |
| GET | `/:workspaceId/stats` | Dashboard stats |
| POST | `/:workspaceId/invite` | Invite member by email |
| POST | `/:workspaceId/accept-invite` | Accept invite (link-based) |
| POST | `/:workspaceId/transfer-ownership` | Transfer workspace ownership |
| POST | `/accept-invite-by-token` | Accept invite (token-based) |

### Projects (`/api-v1/projects`) — 🔒 Auth required
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workspaces/:workspaceId` | Create project |
| GET | `/:projectId` | Project details |
| GET | `/:projectId/tasks` | Project + tasks |
| PUT | `/:projectId` | Update project |
| PUT | `/:projectId/members` | Update project members |
| DELETE | `/:projectId` | Delete project |

### Tasks (`/api-v1/tasks`) — 🔒 Auth required
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/:projectId` | Create task |
| GET | `/my-tasks` | My assigned tasks |
| GET | `/:taskId` | Task details |
| PATCH | `/:taskId/title` | Update title |
| PATCH | `/:taskId/description` | Update description |
| PATCH | `/:taskId/status` | Update status |
| PATCH | `/:taskId/priority` | Update priority |
| PATCH | `/:taskId/assignees` | Update assignees |
| DELETE | `/:taskId` | Delete task |
| POST | `/:taskId/subtasks` | Add subtask |
| PATCH | `/:taskId/subtasks/:subTaskId` | Toggle subtask completion |
| GET | `/:taskId/comments` | Get comments |
| POST | `/:taskId/comments` | Add comment |
| POST | `/comments/:commentId/reactions` | Toggle emoji reaction on comment |
| POST | `/:taskId/attachments` | Add attachment |
| DELETE | `/:taskId/attachments/:attachmentId` | Delete attachment |
| GET | `/:resourceId/activity` | Activity log |

### Users (`/api-v1/users`) — 🔒 Auth required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get current user profile |
| PATCH | `/profile` | Update profile (name, etc.) |
| POST | `/avatar` | Upload avatar (Cloudinary) |
| PATCH | `/change-password` | Change password |
| GET | `/workspace/:workspaceId/members` | Get workspace members |
