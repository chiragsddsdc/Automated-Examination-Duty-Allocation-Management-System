# Automated Examination Duty Allocation & Management System

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-8.0+-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![XAMPP](https://img.shields.io/badge/XAMPP-3.3.0-FB7A24?style=for-the-badge&logo=xampp&logoColor=white)
![PHPMailer](https://img.shields.io/badge/PHPMailer-6.9-EF4444?style=for-the-badge&logo=gmail&logoColor=white)
![SheetJS](https://img.shields.io/badge/SheetJS-xlsx--js--style-22C55E?style=for-the-badge&logo=microsoftexcel&logoColor=white)

**A full-stack web application that automates the allocation of examination duties to faculty members using a smart constraint-based algorithm.**

*Final Year Project — Computer Science Engineering*

[![GitHub stars](https://img.shields.io/github/stars/chiragsddsdc/Automated-Examination-Duty-Allocation-Management-System?style=social)](https://github.com/chiragsddsdc/Automated-Examination-Duty-Allocation-Management-System)

</div>

---

## Table of Contents

- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Allocation Algorithm](#-the-allocation-algorithm)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-login-credentials)
- [API Reference](#-api-reference)
- [Author](#-author)

---

## Problem Statement

In educational institutions, allocating examination duties — invigilation, supervision, flying squad, and evaluation — to faculty members is a time-consuming, error-prone, and often biased manual process. Conflicts arise when the same faculty is double-booked, when their own department's exam is assigned to them, or when workload is distributed unfairly.

This system automates the entire lifecycle: from schedule creation and availability submission to one-click duty assignment, email notification, and report generation — ensuring fair, transparent, and conflict-free allocation in seconds.

---

## Features

### Admin Portal

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time statistics — total exams, allocations, faculty count, department-wise workload charts |
| **Faculty Management** | Add, edit, deactivate faculty with employee ID, department, designation, contact info |
| **Exam Schedule Management** | Create, edit, and delete exam schedules with subject, date, time, venue, student count |
| **Excel Schedule Import** | Bulk-import exam schedules from `.xlsx` / `.csv` files via PhpSpreadsheet; preview before committing |
| **Auto Allocation** | One-click smart duty assignment using a weighted round-robin algorithm with full constraint checking |
| **Allocation Management** | View, manually edit, and track all duty assignments across all exams |
| **PDF Duty Slips** | Per-faculty printable duty slips with college letterhead, info table, duties table, and signature fields — no external PDF library |
| **Excel Export (.xlsx)** | Formatted spreadsheet export with dark-blue header row, alternating row shading, column widths, and a Summary sheet |
| **CSV Export** | Plain comma-separated export of all allocation data |
| **Timetable Grid View** | Weekly calendar grid showing all exams by date and time slot, colour-coded by department, with assigned faculty listed per cell |
| **Notifications** | Send and manage duty notifications to individual or all faculty members |
| **Change Password** | Secure in-app password change with strength indicator and bcrypt hashing |

### Faculty Portal

| Feature | Description |
|---------|-------------|
| **Personal Dashboard** | Upcoming duties, duty count stats, recent notifications summary |
| **My Duties** | Complete duty history with exam date, subject, time, venue, duty type, and status tracking |
| **Availability** | Mark unavailable dates and time slots; the allocator respects these constraints automatically |
| **Notifications** | Real-time alerts when new duties are assigned; mark as read individually or all at once |
| **Change Password** | Secure password change with current-password verification, strength meter, and confirm-match validation |

### Authentication & Security

| Feature | Description |
|---------|-------------|
| **Separate Login Pages** | Dedicated `/admin-login` and `/faculty-login` portals with role enforcement — logging into the wrong portal shows a clear "Access Denied" screen |
| **Professional Landing Page** | Modern dark-theme landing page with animated gradient background, glassmorphism portal cards, and feature pills |
| **Forgot Password with OTP** | Email-based 6-digit OTP reset flow — OTP stored with 15-minute expiry, bcrypt hashed on save, all sessions invalidated on reset |
| **Token-Based Auth** | 64-character cryptographically secure tokens stored server-side; one active session per user |
| **Rate Limiting** | Login attempts limited to 5 per minute per IP; forgot-password requests limited to 5 per 10 minutes |
| **Input Validation** | Server-side email format, password length (6–72 chars), and bcrypt-safe checks on every endpoint |
| **Email Notifications** | Duty assignment emails sent via Gmail SMTP using PHPMailer with HTML templates, plain-text fallback |

---

## The Allocation Algorithm

The core of this system uses a **Weighted Round-Robin Algorithm with Constraint Checking**:

```
Input  → List of exam schedules with required duty counts
         List of active faculty sorted by current workload (ascending)

Step 1 → For each exam slot that needs duties filled:

Step 2 → Iterate faculty in workload order. Skip if ANY constraint fails:
         ✗ Faculty belongs to the same department as the exam subject
         ✗ Faculty has another duty assigned at an overlapping time on that date
         ✗ Faculty has reached their configured max_duties_per_week limit
         ✗ Faculty has explicitly marked themselves unavailable for that date/time

Step 3 → Assign the duty with a rotating duty type:
         Invigilation → Supervision → Flying Squad → Evaluation → repeat

Step 4 → Increment the assigned faculty's duty count so the next iteration
         picks the next-least-loaded faculty (maintains fairness)

Step 5 → Send an email notification to the assigned faculty automatically

Step 6 → Repeat until all required duties for all exam slots are filled

Output → Populated duty_allocations table + email notifications sent
```

This guarantees **fair workload distribution** across all departments while respecting all institutional constraints with zero manual intervention.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | Single Page Application framework |
| React Router | v6 | Client-side routing with protected routes |
| Axios | latest | HTTP client with request interceptors |
| Recharts | latest | Dashboard charts and visualizations |
| react-hot-toast | latest | Toast notifications |
| SheetJS (`xlsx-js-style`) | 1.2.0 | Formatted `.xlsx` export with cell styles (CDN) |
| CSS (custom) | — | Dark theme, glassmorphism, responsive grid |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | 8.0+ | REST API endpoints |
| MySQL | 8.0 | Relational data storage |
| PHPMailer | ^7.0 | Gmail SMTP email delivery (duty alerts + OTP) |
| PhpSpreadsheet | ^5.5 | Server-side Excel/CSV schedule import parsing |
| Apache (XAMPP) | 3.3+ | Local development server |

### Security

| Mechanism | Implementation |
|-----------|---------------|
| Password hashing | `password_hash()` / `password_verify()` with `PASSWORD_BCRYPT` |
| Auth tokens | `bin2hex(random_bytes(32))` — 64-char hex, stored in `auth_tokens` table |
| OTP generation | `random_int(0, 999999)` formatted as zero-padded 6-digit string |
| SQL injection | 100% prepared statements with `bind_param()` — no string interpolation in queries |
| XSS | All user-supplied strings pass through `htmlspecialchars()` via `sanitizeStr()` |
| CORS | Configured per-origin in `config/cors.php` |
| Rate limiting | IP-based counter in PHP session — configurable per action |

---

## Project Structure

```
project/
├── backend/
│   ├── api/
│   │   ├── auth.php              ← Login, logout, me, change_password,
│   │   │                              forgot_password (OTP), reset_password
│   │   ├── faculty.php           ← Faculty CRUD
│   │   ├── schedules.php         ← Exam schedule CRUD
│   │   ├── allocate.php          ← ⚡ Core allocation algorithm
│   │   ├── availability.php      ← Faculty availability management
│   │   ├── notifications.php     ← Notification system
│   │   ├── dashboard.php         ← Aggregated statistics
│   │   ├── import.php            ← Excel / CSV schedule import (PhpSpreadsheet)
│   │   └── hash.php              ← Password hash utility (dev only)
│   ├── config/
│   │   ├── db.php                ← MySQLi connection + helpers (getDB, respond, requireAuth…)
│   │   ├── cors.php              ← CORS headers + Bearer token extractor
│   │   ├── validation.php        ← sanitizeStr, validateEmail, validateLength, rate limiting
│   │   └── email.php             ← PHPMailer setup + sendDutyAssignmentEmail()
│   ├── vendor/                   ← Composer dependencies (PHPMailer, PhpSpreadsheet)
│   ├── composer.json
│   └── database.sql              ← Full schema + seed data (including password_resets table)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── LandingPage.js            ← Dark-theme landing page with portal cards
        │   ├── AdminLogin.js             ← Purple-themed admin login (login/denied/forgot/sent)
        │   ├── FacultyLogin.js           ← Blue-themed faculty login (same flow)
        │   ├── admin/
        │   │   ├── Dashboard.js
        │   │   ├── FacultyManagement.js
        │   │   ├── ExamSchedules.js
        │   │   ├── ImportSchedule.js     ← Drag-and-drop Excel import with preview
        │   │   ├── RunAllocation.js      ← Allocation runner with live progress
        │   │   ├── Allocations.js
        │   │   ├── Reports.js            ← PDF slips, Excel export, Timetable grid
        │   │   ├── Notifications.js
        │   │   └── ChangePassword.js     ← Purple-themed, strength meter
        │   └── faculty/
        │       ├── Dashboard.js
        │       ├── MyDuties.js
        │       ├── Availability.js
        │       ├── Notifications.js
        │       └── ChangePassword.js     ← Blue-themed, strength meter
        ├── components/
        │   ├── AdminLayout.js            ← Sidebar nav + mobile hamburger
        │   └── FacultyLayout.js
        ├── context/
        │   └── AuthContext.js            ← Global auth state, login/logout
        └── utils/
            └── api.js                    ← Axios instance + all endpoint helpers
```

---

## Screenshots

> Screenshots below show the key pages of the application.

### Landing Page
```
[ Dark-theme landing page with animated gradient blobs, glassmorphism
  portal cards (Admin = purple glow, Faculty = blue glow), feature pills ]
```

### Admin Login
```
[ Purple glassmorphism login card on #0a0a0f dark background ]
```

### Faculty Login
```
[ Blue glassmorphism login card on #0a0a0f dark background ]
```

### Admin Dashboard
```
[ Dark sidebar layout, stats cards, department workload chart ]
```

### Run Allocation
```
[ Allocation controls, constraint summary, progress feedback ]
```

### Reports — Duty Report Tab
```
[ Grouped exam cards with faculty tables, CSV / Excel / PDF / Print buttons ]
```

### Reports — Timetable View Tab
```
[ Weekly calendar grid, department colour-coded exam cards per cell,
  assigned faculty list, department legend ]
```

### PDF Duty Slip (print preview)
```
[ Per-faculty official slip: letterhead, info table, duties table,
  three signature fields — ready to print or Save as PDF ]
```

### Faculty — My Duties
```
[ Duty list with subject, date, time, venue, status badges ]
```

### Change Password
```
[ Three-field form with real-time strength meter and confirm-match indicator ]
```

---

## Getting Started

### Prerequisites

- [XAMPP](https://apachefriends.org) 3.3+ (Apache + MySQL)
- [Node.js](https://nodejs.org) 18+ LTS
- [Composer](https://getcomposer.org) (PHP package manager)
- [Git](https://git-scm.com)

### 1 — Clone the repository

```bash
git clone https://github.com/chiragsddsdc/Automated-Examination-Duty-Allocation-Management-System.git
cd Automated-Examination-Duty-Allocation-Management-System
```

### 2 — Install PHP dependencies

```bash
cd backend
composer install
```

This installs:
- **PHPMailer ^7.0** — Gmail SMTP email delivery
- **PhpSpreadsheet ^5.5** — Excel/CSV import parsing

### 3 — Configure email (Gmail SMTP)

Open `backend/config/email.php` and update the credentials:

```php
define('MAIL_USERNAME', 'your-gmail@gmail.com');
define('MAIL_PASSWORD', 'your-app-password');   // Gmail App Password (not your account password)
define('MAIL_FROM_NAME', 'Exam Duty System');
```

> **How to get a Gmail App Password:**
> Google Account → Security → 2-Step Verification (must be ON) → App Passwords → Generate

### 4 — Set up the database

- Open XAMPP Control Panel → Start **Apache** and **MySQL**
- Go to `http://localhost/phpmyadmin`
- Create a new database named `exam_duty_db`
- Import `backend/database.sql`

This creates all tables including:

| Table | Purpose |
|-------|---------|
| `users` | Admin and faculty accounts |
| `faculty_profiles` | Employee ID, department, designation |
| `exam_schedules` | Exam timetable entries |
| `duty_allocations` | Assignment records |
| `availability` | Faculty unavailability slots |
| `notifications` | In-app notification inbox |
| `auth_tokens` | Active session tokens |
| `password_resets` | OTP records for forgot-password flow |

### 5 — Copy backend to XAMPP htdocs

```bash
# Windows
xcopy /E /I backend C:\xampp\htdocs\exam-duty\backend

# macOS / Linux
cp -r backend /Applications/XAMPP/htdocs/exam-duty/backend
```

### 6 — Install frontend dependencies and start

```bash
cd ../frontend
npm install
npm start
```

The app opens at **`http://localhost:3000`**

> Make sure the `baseURL` in `frontend/src/utils/api.js` matches your XAMPP path:
> ```js
> baseURL: 'http://localhost/exam-duty/backend/api'
> ```

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@exam.edu | password123 |
| Faculty | priya@exam.edu | password123 |
| Faculty | rahul@exam.edu | password123 |
| Faculty | anita@exam.edu | password123 |
| Faculty | suresh@exam.edu | password123 |
| Faculty | meena@exam.edu | password123 |

> Passwords are stored as bcrypt hashes. The seed data uses the hash for `password123`.
> Change credentials immediately in a production environment.

---

## API Reference

All endpoints live at `http://localhost/exam-duty/backend/api/`.
Protected endpoints require `Authorization: Bearer <token>` header.

### Authentication — `auth.php`

| Method | Action | Auth | Description |
|--------|--------|------|-------------|
| `POST` | `?action=login` | No | Email + password → returns token |
| `POST` | `?action=logout` | Yes | Deletes active session token |
| `GET` | `?action=me` | Yes | Returns current user object |
| `POST` | `?action=change_password` | Yes | Old + new password change |
| `POST` | `?action=forgot_password` | No | Sends 6-digit OTP to email |
| `POST` | `?action=reset_password` | No | Email + OTP + new password |

### Faculty — `faculty.php`

| Method | Auth | Description |
|--------|------|-------------|
| `GET` | Yes | List all faculty (admin) or own profile (faculty) |
| `POST` | Admin | Create new faculty member |
| `PUT` | Admin | Update faculty details |
| `DELETE` | Admin | Deactivate faculty account |

### Schedules — `schedules.php`

| Method | Auth | Description |
|--------|------|-------------|
| `GET` | Yes | List all exam schedules |
| `POST` | Admin | Create exam schedule |
| `PUT` | Admin | Update schedule |
| `DELETE` | Admin | Delete schedule |

### Allocations — `allocate.php`

| Method | Auth | Description |
|--------|------|-------------|
| `GET` | Yes | List allocations (filterable by exam, faculty, status) |
| `POST` | Admin | Run auto-allocation algorithm |
| `PUT` | Admin | Manually update an allocation |
| `DELETE` | Admin | Remove an allocation |

### Other Endpoints

| File | Method | Description |
|------|--------|-------------|
| `availability.php` | GET / POST / DELETE | Faculty availability slots |
| `notifications.php` | GET / PUT | Fetch notifications, mark as read |
| `dashboard.php` | GET | Aggregated stats for dashboard |
| `import.php` | POST | Upload Excel/CSV for schedule import |

---

## Forgot Password Flow

```
User enters email on login page
        ↓
POST /auth.php?action=forgot_password
        ↓
Server: lookup user silently (no account-existence leak)
        ↓
Generate random_int OTP (6 digits, zero-padded)
        ↓
Store in password_resets table (expires_at = NOW + 15 min)
        ↓
Send HTML email via PHPMailer with styled OTP block
        ↓
User enters email + OTP + new password
        ↓
POST /auth.php?action=reset_password
        ↓
Server: verify OTP not expired, not used → update password
        ↓
Mark OTP used=1, delete all auth_tokens for user
        ↓
User logs in with new password
```

---

## Responsive Design

The application is fully mobile-responsive:

- **Sidebar** collapses to a hamburger menu on screens below 768px
- **Dashboard cards** reflow from 4-column to 2-column to 1-column grid
- **Tables** scroll horizontally on small screens
- **Timetable grid** scrolls horizontally while keeping the time-slot column sticky
- **Portal cards** on the landing page stack vertically below 600px

---

## Author

**Chirag Yadav**
- GitHub: [@chiragsddsdc](https://github.com/chiragsddsdc)

---

## License

This project is built as a Final Year Project for academic purposes.

---

<div align="center">
  <p>⭐ Star this repo if you found it helpful!</p>
  <p>Made with ❤️ for Final Year Project</p>
</div>
