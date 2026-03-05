# ExamDuty — Automated Examination Duty Allocation System
### Final Year Project Setup Guide

---

## What's in this project?

```
project/
├── backend/                ← PHP backend (goes into XAMPP)
│   ├── api/
│   │   ├── auth.php        ← Login / Logout / Session
│   │   ├── faculty.php     ← Faculty CRUD
│   │   ├── schedules.php   ← Exam schedule CRUD
│   │   ├── allocate.php    ← ⚡ Core allocation algorithm
│   │   ├── availability.php← Faculty availability
│   │   ├── notifications.php
│   │   └── dashboard.php   ← Dashboard stats
│   ├── config/
│   │   ├── db.php          ← Database connection
│   │   └── cors.php        ← CORS + helper functions
│   └── database.sql        ← Complete database with seed data
│
└── frontend/               ← React frontend
    ├── src/
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── admin/      ← Admin pages (Dashboard, Faculty, Schedules, Allocation, Reports)
    │   │   └── faculty/    ← Faculty pages (Dashboard, Duties, Availability, Notifications)
    │   ├── components/     ← Layouts (sidebar navigation)
    │   ├── context/        ← Auth state management
    │   └── utils/api.js    ← All API calls
    └── package.json
```

---

## Step-by-Step Setup

### Step 1 — Install Required Software

Download and install these (in order):

1. **XAMPP** → https://apachefriends.org (Choose Windows/Mac/Linux version)
2. **Node.js** → https://nodejs.org (Download the LTS version)
3. **VS Code** → https://code.visualstudio.com

### Step 2 — Set Up the Backend (PHP)

1. Open the XAMPP folder on your computer:
   - Windows: `C:\xampp\htdocs\`
   - Mac: `/Applications/XAMPP/htdocs/`

2. Create a new folder called `exam-duty` inside htdocs

3. Copy the entire `backend/` folder into `htdocs/exam-duty/`
   - Final path should be: `htdocs/exam-duty/backend/`

4. Open XAMPP Control Panel → Start **Apache** and **MySQL**

5. Open your browser → Go to: `http://localhost/phpmyadmin`

6. Click **New** (left sidebar) → Create database named: `exam_duty_db`

7. Click on `exam_duty_db` → Click **Import** tab → Choose file: `backend/database.sql` → Click **Go**

   ✅ Database is ready with sample data!

### Step 3 — Set Up the Frontend (React)

1. Open a terminal (Command Prompt / Terminal)

2. Navigate to the frontend folder:
   ```
   cd path/to/project/frontend
   ```

3. Install all dependencies:
   ```
   npm install
   ```
   (This takes 2-3 minutes the first time)

4. Start the React app:
   ```
   npm start
   ```

5. Browser opens automatically at: `http://localhost:3000`

---

## Login Credentials

| Role    | Email              | Password |
|---------|--------------------|----------|
| Admin   | admin@exam.edu     | password |
| Faculty | priya@exam.edu     | password |
| Faculty | rahul@exam.edu     | password |
| Faculty | anita@exam.edu     | password |

> Note: The seed data uses bcrypt hashed passwords. If login fails, go to phpMyAdmin → users table → update password with a fresh hash.
> Generate hash at: https://bcrypt.online/ (use "password" as input, cost 10)

---

## How to Use the System

### Admin Workflow:
1. Login as Admin
2. Go to **Faculty** → Add faculty members
3. Go to **Exam Schedules** → Create exam timetables
4. Go to **Run Allocation** → Click "Run Allocation" button
5. The algorithm auto-assigns duties to eligible faculty
6. Go to **Allocations** → View/edit/manage all assignments
7. Go to **Reports** → Print or export duty slips

### Faculty Workflow:
1. Login as Faculty
2. Go to **Availability** → Mark any dates you can't attend
3. Go to **My Duties** → See duties assigned to you
4. Check **Notifications** for duty alerts

---

## Algorithm Explanation (for viva)

The allocation uses **Weighted Round-Robin with Constraint Checking**:

1. **Sort faculty** by workload (least-loaded first) for fair distribution
2. **Check Constraint 1**: Faculty cannot invigilate their own department's exam
3. **Check Constraint 2**: No time conflicts (cannot be double-booked)
4. **Check Constraint 3**: Respect max duties per week per faculty
5. **Check Constraint 4**: Skip faculty marked as unavailable
6. **Assign duty** with rotating duty types (invigilation → supervision → flying squad → evaluation)
7. **Send notification** to assigned faculty automatically

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18, React Router v6 |
| Styling   | Custom CSS (no external UI library) |
| Charts    | Recharts |
| Backend   | PHP 8 (REST APIs) |
| Database  | MySQL (via XAMPP) |
| Reports   | Browser Print + CSV Export |
| Auth      | PHP Sessions + bcrypt |

---

## Troubleshooting

**"Failed to fetch" or network errors:**
- Make sure XAMPP Apache and MySQL are running
- Check the API URL in `frontend/src/utils/api.js` matches your XAMPP path

**Login not working:**
- Check phpMyAdmin that the `exam_duty_db` database was imported
- Try regenerating password hash at bcrypt.online

**npm install fails:**
- Make sure Node.js is installed: run `node --version` in terminal
- Try: `npm install --legacy-peer-deps`

**CORS errors:**
- Check `backend/config/cors.php` — the origin should be `http://localhost:3000`
