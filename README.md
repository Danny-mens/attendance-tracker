# Student Attendance Tracker (AttendEase style)

A school project built with HTML, CSS, JavaScript, PHP and MySQL.

## Features
- Teacher login with sessions and hashed passwords
- Dashboard: today's totals, 7-day attendance trend, class rates, recent records
- Students: add, edit, delete, search, assign to a class
- Classes: add and delete, with student counts
- Daily attendance: Present, Absent, Late, Excused, "Mark all present"
- Attendance summary with a rate per student (excused days are not counted)
- Reports: filter by date range and class, export to CSV

## Setup
1. Install XAMPP and start Apache and MySQL.
2. Copy this folder to `C:\xampp\htdocs\attendance-tracker`.
3. Open http://localhost/phpmyadmin, go to the Import tab, and import `database/schema.sql`.
4. Open http://localhost/attendance-tracker/login.html
5. Log in with `admin` / `password`, then change the password.

## Tech used
HTML, CSS, JavaScript (fetch API), PHP (PDO), MySQL, XAMPP

## Screenshots
![Login](screenshots/login.png)
![Dashboard](screenshots/dashboard.png)
![Attendance](screenshots/attendance.png)
![Reports](screenshots/reports.png)

## Author
Adjalo Mensah Daniel