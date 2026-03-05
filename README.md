# 📋 Automated Examination Duty Allocation & Management System

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-8.0-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![XAMPP](https://img.shields.io/badge/XAMPP-3.3.0-FB7A24?style=for-the-badge&logo=xampp&logoColor=white)

**A full-stack web application that automates the allocation of examination duties to faculty members using a smart constraint-based algorithm.**

*Final Year Project — Computer Science Engineering*

</div>

---

## 🎯 Problem Statement

In educational institutions, allocating examination duties (invigilation, supervision, flying squad, evaluation) to faculty members is a time-consuming, error-prone, and often biased manual process. This system automates the entire process — ensuring fair, transparent, and conflict-free duty allocation in seconds.

---

## ✨ Key Features

### 👨‍💼 Admin Portal
- 📊 **Dashboard** — Real-time stats with department-wise workload charts
- 👥 **Faculty Management** — Add, edit, deactivate faculty members
- 📅 **Exam Schedule Management** — Create and manage exam timetables
- ⚡ **Auto Allocation** — One-click smart duty assignment
- 📋 **Allocation Management** — View, edit, and track all duty assignments
- 📄 **Reports** — Print-ready duty slips and CSV export
- 🔔 **Notifications** — Real-time duty alerts to faculty

### 🎓 Faculty Portal
- 📊 **Personal Dashboard** — View upcoming duties and stats
- 📋 **My Duties** — Complete duty history with status tracking
- 📅 **Availability** — Mark unavailable dates to avoid conflicts
- 🔔 **Notifications** — Instant alerts when duties are assigned

---

## ⚡ The Allocation Algorithm

The core of this system uses a **Weighted Round-Robin Algorithm with Constraint Checking**:

```
Step 1 → Sort faculty by current workload (least duties first)
Step 2 → For each exam slot, check constraints:
         ✗ Skip if faculty belongs to same department as exam
         ✗ Skip if faculty has a time conflict on that date
         ✗ Skip if faculty has reached max duties for the week
         ✗ Skip if faculty marked themselves as unavailable
Step 3 → Assign duty with rotating duty types
         (Invigilation → Supervision → Flying Squad → Evaluation)
Step 4 → Send notification to assigned faculty automatically
Step 5 → Repeat until all exam slots are filled
```

This ensures **fair workload distribution** across all faculty members while respecting all institutional constraints.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + React Router v6 | Single Page Application |
| Styling | Custom CSS | Dark theme UI |
| Charts | Recharts | Dashboard visualizations |
| Backend | PHP 8 (REST APIs) | Server-side logic |
| Database | MySQL | Data storage |
| Auth | Token-based (bcrypt) | Secure login system |
| Reports | Browser Print + CSV | Duty slip generation |
| Server | XAMPP (Apache) | Local development |

---

## 📁 Project Structure

```
project/
├── backend/                    ← PHP REST API
│   ├── api/
│   │   ├── auth.php            ← Login / Logout / Token auth
│   │   ├── faculty.php         ← Faculty CRUD operations
│   │   ├── schedules.php       ← Exam schedule management
│   │   ├── allocate.php        ← ⚡ Core allocation algorithm
│   │   ├── availability.php    ← Faculty availability management
│   │   ├── notifications.php   ← Notification system
│   │   └── dashboard.php       ← Dashboard statistics
│   ├── config/
│   │   ├── db.php              ← Database connection
│   │   └── cors.php            ← CORS + Auth middleware
│   └── database.sql            ← Complete schema + seed data
│
└── frontend/                   ← React Application
    └── src/
        ├── pages/
        │   ├── Login.js
        │   ├── admin/          ← Admin dashboard pages
        │   └── faculty/        ← Faculty dashboard pages
        ├── components/         ← Shared layout components
        ├── context/            ← Auth state management
        └── utils/api.js        ← Centralized API calls
```

---

## 🚀 Getting Started

### Prerequisites
- [XAMPP](https://apachefriends.org) (Apache + MySQL)
- [Node.js](https://nodejs.org) (LTS version)
- [Git](https://git-scm.com)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/chiragsddsdc/Automated-Examination-Duty-Allocation-Management-System.git
cd Automated-Examination-Duty-Allocation-Management-System
```

**2. Set up the Backend**
```bash
# Copy backend folder to XAMPP
# Windows: C:\xampp\htdocs\exam-duty\
# Mac: /Applications/XAMPP/htdocs/exam-duty/
```

- Open XAMPP Control Panel → Start **Apache** and **MySQL**
- Go to `http://localhost/phpmyadmin`
- Create database: `exam_duty_db`
- Import `backend/database.sql`

**3. Set up the Frontend**
```bash
cd frontend
npm install
npm start
```

- App opens at `http://localhost:3000`

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 👨‍💼 Admin | admin@exam.edu | password123 |
| 🎓 Faculty | priya@exam.edu | password123 |
| 🎓 Faculty | rahul@exam.edu | password123 |
| 🎓 Faculty | anita@exam.edu | password123 |
| 🎓 Faculty | suresh@exam.edu | password123 |
| 🎓 Faculty | meena@exam.edu | password123 |

---

## 🔮 Future Enhancements

- [ ] 📧 Email notifications via PHPMailer + Gmail SMTP
- [ ] 📱 SMS alerts via Twilio API
- [ ] 🔑 Faculty password change feature
- [ ] 📊 Advanced analytics and workload reports
- [ ] 📱 Mobile responsive design
- [ ] ☁️ Cloud deployment (AWS / Hostinger)
- [ ] 🔄 Automatic exam schedule import from Excel

---

## 🧑‍💻 Author

**Chirag Yadav**
- GitHub: [@chiragsddsdc](https://github.com/chiragsddsdc)

---

## 📄 License

This project is built as a Final Year Project for academic purposes.

---

<div align="center">
  <p>⭐ Star this repo if you found it helpful!</p>
  <p>Made with ❤️ for Final Year Project</p>
</div>
