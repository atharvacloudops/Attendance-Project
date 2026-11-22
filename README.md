# 🎓 AttendEase — Automated Student Attendance System

A **full-stack**, **face-recognition-based** student attendance system built with:

- **Frontend**: React 18 + React Router v6 + face-api.js
- **Backend**: Node.js + Express + MongoDB
- **Auth**: JWT with role-based access (Admin / Teacher / Student)
- **Face Recognition**: face-api.js running entirely in-browser

---

## 📁 Project Structure

```
attendance-system/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js       # Login, register, me
│   │   ├── user.controller.js       # CRUD users (admin)
│   │   ├── student.controller.js    # Student profiles + face descriptors
│   │   ├── attendance.controller.js # Mark, view, export attendance
│   │   └── class.controller.js      # Class management
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT protect + authorize
│   │   ├── validate.middleware.js   # express-validator error formatter
│   │   └── upload.middleware.js     # Multer for face images
│   ├── models/
│   │   ├── User.model.js            # User schema (name, email, role)
│   │   ├── Student.model.js         # Student profile + face descriptor
│   │   ├── Attendance.model.js      # Attendance records
│   │   └── Class.model.js           # Class/subject management
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── student.routes.js
│   │   ├── attendance.routes.js
│   │   └── class.routes.js
│   ├── utils/
│   │   ├── jwt.utils.js
│   │   ├── response.utils.js
│   │   └── seed.js                  # Creates demo accounts
│   ├── uploads/
│   │   └── faces/                   # Stored face images
│   ├── server.js                    # Express app entry
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── models/                  # ← face-api.js model weights go here
│   └── src/
│       ├── components/
│       │   ├── admin/
│       │   │   ├── AdminDashboard.js
│       │   │   └── AdminPanel.js    # User management table
│       │   ├── teacher/
│       │   │   ├── TeacherDashboard.js
│       │   │   └── TeacherAttendance.js
│       │   ├── student/
│       │   │   ├── StudentDashboard.js
│       │   │   └── StudentAttendance.js
│       │   └── shared/
│       │       ├── FaceCamera.js    # Live face recognition + mark attendance
│       │       ├── FaceRegister.js  # One-time face registration
│       │       ├── AttendanceTable.js
│       │       ├── Layout.js
│       │       ├── Sidebar.js
│       │       ├── Button.js
│       │       ├── Card.js
│       │       ├── FormField.js
│       │       └── LoadingScreen.js
│       ├── context/
│       │   └── AuthContext.js       # Global auth state (Context API + useReducer)
│       ├── hooks/
│       │   └── useFaceRecognition.js # face-api.js hook (load, detect, match)
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── DashboardPage.js     # Role-aware wrapper
│       │   ├── AttendancePage.js
│       │   ├── AdminPage.js
│       │   └── NotFoundPage.js
│       ├── services/
│       │   └── api.service.js       # Axios instance + all API calls
│       ├── App.js                   # Router + guards
│       ├── index.js
│       └── index.css                # Global design system
│
├── scripts/
│   ├── download-models.js           # Node.js model downloader
│   └── download-models.sh           # Bash model downloader
├── package.json                     # Root scripts (concurrently)
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| MongoDB | v6+ (local or Atlas) |
| npm | v9+ |

---

### Step 1 — Clone & Install

```bash
# Clone or unzip the project
cd attendance-system

# Install all dependencies (root + backend + frontend)
npm run install:all
```

---

### Step 2 — Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

---

### Step 3 — Download face-api.js Models

The face recognition models are large binary files (~7 MB total) that must be placed in `frontend/public/models/`.

```bash
# Using Node.js (cross-platform, recommended)
npm run models

# OR using bash (Linux/macOS)
bash scripts/download-models.sh
```

This downloads:
- `tiny_face_detector_model` — fast face detection
- `face_landmark_68_model` — 68-point facial landmarks
- `face_recognition_model` — 128-dim face embeddings
- `face_expression_model` — optional emotion detection

> **Manual alternative**: Download from https://github.com/justadudewhohacks/face-api.js/tree/master/weights and place all files inside `frontend/public/models/`

---

### Step 4 — Seed Demo Accounts

```bash
npm run seed
```

This creates:

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Admin   | admin@demo.com       | admin123    |
| Teacher | teacher@demo.com     | teacher123  |
| Student | student@demo.com     | student123  |
| Student | priya@demo.com       | student123  |

---

### Step 5 — Run the Application

```bash
# Run backend + frontend simultaneously
npm run dev
```

Or run separately:

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

Open **http://localhost:3000** in your browser.

---

## 🎥 Face Recognition Flow

### First-time setup (Student)

1. Login as a student
2. On dashboard, click **"Register Face"**
3. Allow camera access
4. Position face inside the oval guide
5. Click **"Capture Face"** — system takes 5 samples and averages them
6. Face descriptor (128 numbers) is saved to MongoDB

### Marking Attendance

1. Student clicks **"Mark Attendance"** on dashboard
2. Camera opens **in the same page** (no new tab)
3. face-api.js loads all registered descriptors from the API
4. Detection runs every 800ms
5. When a face matches (distance < 0.5):
   - Name, roll number, and confidence % are shown
   - Student clicks **"Confirm Attendance"**
   - Record saved with timestamp, confidence, and method
6. Duplicate prevention: one record per student per day per class

---

## 🔗 API Reference

### Auth

| Method | Endpoint                    | Access  | Description            |
|--------|-----------------------------|---------|------------------------|
| POST   | /api/auth/register          | Public  | Register new user      |
| POST   | /api/auth/login             | Public  | Login, get JWT         |
| GET    | /api/auth/me                | Private | Get current user       |
| PUT    | /api/auth/change-password   | Private | Change password        |

### Students

| Method | Endpoint                         | Access          | Description                  |
|--------|----------------------------------|-----------------|------------------------------|
| GET    | /api/students/me                 | Student         | Own profile                  |
| POST   | /api/students/register-face      | Student         | Save face descriptor         |
| GET    | /api/students/face-descriptors   | Any auth        | All descriptors for matching |
| GET    | /api/students                    | Admin/Teacher   | All students                 |

### Attendance

| Method | Endpoint                              | Access          | Description               |
|--------|---------------------------------------|-----------------|---------------------------|
| POST   | /api/attendance/mark                  | Any auth        | Mark attendance            |
| GET    | /api/attendance/my                    | Student         | Own history                |
| GET    | /api/attendance/class/:classId        | Teacher/Admin   | Class attendance           |
| GET    | /api/attendance/all                   | Admin           | All records                |
| GET    | /api/attendance/export                | Teacher/Admin   | CSV-ready export           |
| PUT    | /api/attendance/:id                   | Teacher/Admin   | Update record              |
| DELETE | /api/attendance/:id                   | Admin           | Delete record              |

### Classes

| Method | Endpoint            | Access        | Description          |
|--------|---------------------|---------------|----------------------|
| GET    | /api/classes        | Any auth      | List classes         |
| POST   | /api/classes        | Teacher/Admin | Create class         |
| GET    | /api/classes/my     | Student       | Enrolled classes     |
| POST   | /api/classes/join   | Student       | Join via code        |
| DELETE | /api/classes/:id    | Admin         | Delete class         |

### Users (Admin)

| Method | Endpoint                       | Access | Description      |
|--------|--------------------------------|--------|------------------|
| GET    | /api/users                     | Admin  | All users        |
| PUT    | /api/users/:id                 | Admin  | Update user      |
| DELETE | /api/users/:id                 | Admin  | Delete user      |
| PATCH  | /api/users/:id/toggle-status   | Admin  | Activate/disable |

---

## 🗄️ Database Schemas

### User
```js
{ name, email, password (bcrypt), role: ['admin','teacher','student'], isActive, avatar }
```

### Student
```js
{ userId (ref User), rollNumber, department, semester, division,
  faceDescriptor: [128 numbers], faceRegistered: bool, faceImagePath, enrolledClasses }
```

### Attendance
```js
{ studentId, classId, markedBy, date, dateString, status: ['present','absent','late'],
  method: ['face_recognition','manual'], confidence (0-1), remarks }
// Unique index: studentId + dateString + classId
```

### Class
```js
{ name, subject, department, semester, division, teacher (ref User),
  students [ref Student], joinCode (6 chars), isActive }
```

---

## 🔐 Role Permissions Summary

| Feature                     | Admin | Teacher | Student |
|-----------------------------|-------|---------|---------|
| View all users              | ✅    | ❌      | ❌      |
| Activate/delete users       | ✅    | ❌      | ❌      |
| Create class                | ✅    | ✅      | ❌      |
| View class attendance       | ✅    | ✅      | ❌      |
| Export CSV                  | ✅    | ✅      | ❌      |
| Register own face           | ❌    | ❌      | ✅      |
| Mark attendance (face)      | ✅    | ✅      | ✅      |
| View own attendance history | ❌    | ❌      | ✅      |
| Join class                  | ❌    | ❌      | ✅      |

---

## 🚀 Production Deployment

### Backend (e.g. Railway, Render, EC2)

```bash
# Set environment variables on your host:
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/attendance
JWT_SECRET=<long random string>
CLIENT_URL=https://your-frontend-domain.com

# Start
cd backend && npm start
```

### Frontend (e.g. Vercel, Netlify)

```bash
# Set build environment variable:
REACT_APP_API_URL=https://your-backend-domain.com/api

# Build
cd frontend && npm run build
# Deploy the build/ folder
```

> **Important**: Place model files in `frontend/public/models/` before building, or host them on a CDN and update `MODEL_URL` in `useFaceRecognition.js`.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| Camera permission denied | Allow camera in browser settings, use HTTPS in production |
| Models not loading | Run `npm run models`, check `/public/models` folder exists |
| Face not detected | Improve lighting, remove glasses, face camera directly |
| Low confidence score | Re-register face in better lighting |
| MongoDB connection error | Ensure MongoDB is running, check MONGO_URI in .env |
| CORS error | Verify `CLIENT_URL` in backend .env matches frontend URL |
| Port already in use | Change `PORT` in backend .env |

---

## 📦 Key Dependencies

**Backend**
- `express` — web framework
- `mongoose` — MongoDB ODM
- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT auth
- `multer` — file uploads
- `express-validator` — input validation
- `cors`, `morgan` — middleware

**Frontend**
- `react`, `react-dom` — UI framework
- `react-router-dom` v6 — SPA routing
- `face-api.js` — in-browser face recognition
- `axios` — HTTP client
- `react-hot-toast` — notifications
- `date-fns` — date formatting

---

## 👥 Demo Workflow

1. **Login as student** → dashboard shows attendance % and stats
2. **Register Face** (first time) → camera opens, capture face
3. **Mark Attendance** → camera opens inline, face detected → confirm
4. **Login as teacher** → create a class, view class attendance, export CSV
5. **Login as admin** → see all users, activate/deactivate, system overview

---

*Built with ❤️ — AttendEase v1.0*
