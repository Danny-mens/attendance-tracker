## Features
- Lecturer accounts: sign up with a code, and each lecturer sees only their own data
- Courses, with the students enrolled in each; attendance is taken per course
- Students: add (with a typed class), edit, delete, search, filter by class
- Attendance: Present / Absent / Late / Excused, "Mark all present", summary per student
- Import students from a CSV file, with preview, skip or update for existing IDs
- Dashboard per course: today's totals, 7-day trend, class rates, recent records
- Reports by date range, course and class, with CSV export

## Setup
1. Install XAMPP and start Apache and MySQL.
2. Copy this folder to `C:\xampp\htdocs\attendance-tracker`.
3. In phpMyAdmin, open the Import tab and import `database/schema.sql`.
4. Copy `php/signup_code.example.php` to `php/signup_code.php` and set your own code.
5. Open http://localhost/attendance-tracker/login.html and sign in with `admin` / `password`, then change the password.