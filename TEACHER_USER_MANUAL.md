# NCNHS Exam System
## Teacher User Manual (SUA Guidebook Draft)

Version: 1.0  
Date: April 5, 2026  
Audience: Teachers, Subject Teachers, Advisers

---

## Table of Contents

1. General Information
2. System Summary
3. Accessing the Application
4. Teacher Account and Login
5. Teacher Dashboard and Navigation
6. Core Teacher Features
   - 6.1 Teacher Subjects
   - 6.2 Teacher Class List
   - 6.3 Create Exam
   - 6.4 Question Bank
   - 6.5 Manage Exams
   - 6.6 Preview and Publish Exam
   - 6.7 Exam Session Monitoring
   - 6.8 Exam Results and Analytics
   - 6.9 Students Needing Attention
   - 6.10 Questions Needing Review
   - 6.11 Student Answer Details
   - 6.12 Create Task and Subject Tasks
   - 6.13 Task Submission Review
   - 6.14 Attendance Scanner
   - 6.15 Attendance Records
   - 6.16 Teacher Profile and Settings
7. Troubleshooting Guide
8. Frequently Asked Questions (FAQ)
9. Data Privacy and Security Reminders
10. Appendix: Screenshot and Figure Checklist

---

## 1. General Information

The NCNHS Exam System is a web-based platform that helps teachers manage digital examinations, monitor student performance, record attendance, and handle task-based assessments.

This manual is prepared as a guided book reference for teachers. It provides practical, step-by-step procedures and suggested screenshots for documentation.

### 1.1 Purpose of This Manual

- Explain how teachers use the system from login to analytics.
- Standardize teacher workflows for exams, tasks, and attendance.
- Serve as source material for your final SUA user manual guidebook.

### 1.2 Scope

This manual covers teacher-side modules only. Student and admin workflows are not detailed here unless needed for teacher context.

---

## 2. System Summary

The teacher module includes the following major capabilities:

- Subject and class management
- Exam creation and publication
- Real-time exam progress monitoring
- Result analysis (scores, item analysis, MPS, top performers)
- Task creation and grading workflow
- Attendance scanning and records
- Profile and account management

---

## 3. Accessing the Application

### 3.1 Open Through Web Browser

1. Open a modern browser (Chrome, Edge, Firefox, Safari).
2. Enter the deployed URL of the NCNHS Exam System.
3. Wait for the login page to load.

Figure 3.1 - Login page shown in browser:
```
+-------------------------------------------------------+
|                NCNHS ASSESSMENT SYSTEM                |
|                        [LOGO]                         |
+-------------------------------------------------------+
|                                                       |
|   Username: [______________________________________]  |
|                                                       |
|   Password: [**************************************]  |
|                                                       |
|                 [      LOGIN      ]                   |
|                                                       |
+-------------------------------------------------------+
|  Privacy Policy | Terms of Service | Install App      |
+-------------------------------------------------------+
```

### 3.2 Recommended Devices and Browser Versions

- Desktop/Laptop: Windows 10+, macOS latest
- Mobile/Tablet: Android 10+, iOS 13+
- Browser: Latest version of Chrome/Edge preferred
- Internet: Stable connection for real-time exam tracking

---

## 4. Teacher Account and Login

### 4.1 Logging In

1. On the login page, enter your username.
2. Enter your password.
3. Click **Login**.
4. If credentials are valid, you will be redirected to the teacher dashboard.

Figure 4.1 - Teacher login form:
```
+------------------------------------------+
|            NCNHS Exam System             |
|                  [LOGO]                  |
+------------------------------------------+
|  Username: [__________________________]  |
|  Password: [**************************]  |
|                                          |
|            [ LOGIN BUTTON ]              |
+------------------------------------------+
```

### 4.2 Common Login Issues

- Incorrect username/password: recheck input and keyboard casing.
- Session expired: log in again.
- Account issue: contact administrator for account reset.

---

## 5. Teacher Dashboard and Navigation

After login, the dashboard provides quick access to your core tools:

- Subjects and class lists
- Exam creation and management
- Tasks and submissions
- Attendance modules
- Reports and performance analytics

### 5.1 Basic Navigation Pattern

1. Use the side menu/top navigation.
2. Open a module (example: Manage Exams).
3. Select a subject, section, or exam.
4. Perform action (create, review, publish, analyze).

Figure 5.1 - Teacher dashboard with labeled menu items:
```
+---+--------------------------------------+
| S | [Time/Date]                 [Profile]|
| I +--------------------------------------+
| D |  TEACHER DASHBOARD                   |
| E |  +----------+ +----------+ +-------+ |
| N |  | Students | | Exams    | | Tasks | |
| A |  |    45    | |    12    | |   8   | |
| V |  +----------+ +----------+ +-------+ |
|   |                                      |
|   |  [ Students Attention ] [ Top Perf ] |
|   |  [ Question Analysis ]               |
+---+--------------------------------------+
```

---

## 6. Core Teacher Features

## 6.1 Teacher Subjects

Purpose: View and manage assigned subjects.

Steps:

1. Open **Teacher Subjects**.
2. Select the subject you want to work on.
3. Use the available actions (view classes, exams, tasks).

Figure 6.1 - Teacher Subjects page with subject cards/list:
```
+------------------------------------------+
|  TEACHER SUBJECTS            [SUBJECTS]  |
+------------------------------------------+
|  +--------------+    +--------------+    |
|  | Mathematics  |    | Science      |    |
|  | [G10-A, B]   |    | [G9-C]       |    |
|  | [VIEW EXAMS] |    | [VIEW EXAMS] |    |
|  | [VIEW TASKS] |    | [VIEW TASKS] |    |
|  +--------------+    +--------------+    |
+------------------------------------------+
```

## 6.2 Teacher Class List

Purpose: View students under a class/section.

Steps:

1. Open **Teacher Class List**.
2. Choose a grade/section.
3. Review student list and available actions.
4. (If enabled) Open student performance details.

Figure 6.2 - Class list table with student actions:
```
+------------------------------------------+
|  < BACK  CLASS LIST: G10-OAK    [CLASS]  |
+------------------------------------------+
|  Filter: [__________]  [SCAN ATTENDANCE] |
+------------------------------------------+
|  # | LRN        | Name       | Status    |
|  1 | 1023456... | Dela Cruz  | Enrolled  |
|  2 | 1023456... | Santos, J. | Enrolled  |
+------------------------------------------+
```

## 6.3 Create Exam

Purpose: Build a new exam.

Steps:

1. Open **Create Exam**.
2. Enter exam metadata (title, instructions, subject, duration).
3. Add question parts/items.
4. Define score or points per item.
5. Save draft.

Figure 6.3 - Create Exam form and question builder:
```
+------------------------------------------+
|  CREATE NEW EXAM           [ADD_CIRCLE]  |
+------------------------------------------+
|  Title: [______________________________] |
|  Subject: [Select Subject V]             |
|  Duration: [60] mins                     |
+------------------------------------------+
|  PART 1: Multiple Choice                 |
|  Q1: [__________________________] [AI]   |
|  A) [__] B) [__] C) [__] D) [__]         |
|  [+ ADD QUESTION]       [SAVE DRAFT]     |
+------------------------------------------+
```

## 6.4 Question Bank

Purpose: Store and reuse question items.

Steps:

1. Open **Question Bank**.
2. Search or filter by subject/topic.
3. Add new questions or import existing ones into an exam.
4. Edit items when needed.

Figure 6.4 - Question Bank with filters and item list:
```
+------------------------------------------+
|  QUESTION BANK             [INVENTORY]   |
+------------------------------------------+
|  Filter: [Subject V] [Type V] [Search Q] |
+------------------------------------------+
|  +------------------------------------+  |
|  | Q: What is 2+2?          [MATH]    |  |
|  | A: 4 [EDIT] [DELETE] [IMPORT]      |  |
|  +------------------------------------+  |
+------------------------------------------+
```

## 6.5 Manage Exams

Purpose: Edit, archive, or organize existing exams.

Steps:

1. Open **Manage Exams**.
2. Select exam from the list.
3. Edit details, duplicate exam, or archive when finished.

Figure 6.5 - Manage Exams table with action buttons:
```
+------------------------------------------+
|  MANAGE EXAMS                 [EXAMS]    |
+------------------------------------------+
|  [ ACTIVE ] [ ARCHIVED ]                 |
+------------------------------------------+
|  +------------------------------------+  |
|  | Midterm Exam - Math      [PUBLISHED]  |
|  | [EDIT] [DUPLICATE] [RESULTS] [v]   |  |
|  +------------------------------------+  |
+------------------------------------------+
```

## 6.6 Preview and Publish Exam

Purpose: Check exam quality before student access.

Steps:

1. Open **Preview Exam** or **Exam Paper Preview**.
2. Verify questions, choices, scoring, and formatting.
3. Return to edit if needed.
4. Publish when finalized.

Figure 6.6 - Exam preview page before publishing:
```
+------------------------------------------+
|  PREVIEW: Midterm Exam - Math            |
+------------------------------------------+
|  1. Which of the following...            |
|     (A) Option 1  *(Correct)*            |
|     (B) Option 2                         |
+------------------------------------------+
|  [ EDIT ]              [ PUBLISH NOW ]   |
+------------------------------------------+
```

## 6.7 Exam Session Monitoring

Purpose: Track live student exam status.

Steps:

1. Open the active exam.
2. Launch **Exam Progress Modal** or monitor view.
3. Watch completion status, in-progress counts, and timestamps.
4. Take appropriate action for irregular sessions.

Figure 6.7 - Exam progress monitor during active session:
```
+------------------------------------------+
|  EXAM PROGRESS: Midterm Math             |
+------------------------------------------+
|  Active: 30 | Completed: 5 | Waiting: 2  |
+------------------------------------------+
|  Dela Cruz, Juan  [||||||||||-----] 60%  |
|  Santos, Maria    [|||||||||||||||] 100% |
+------------------------------------------+
```

## 6.8 Exam Results and Analytics

Purpose: Analyze class and student performance.

Related pages include:

- Exam Results
- Archived Exam Results
- Exam MPS View
- Exam Part Results
- Item Analysis
- Top Performers
- Student Performance

Basic workflow:

1. Open **Exam Results**.
2. Select exam and section.
3. Review summary scores and pass/fail trend.
4. Open deeper analysis pages (MPS, item analysis, top performers).
5. Export or document findings for intervention.

Figure 6.8 - Exam Results summary dashboard:
```
+------------------------------------------+
|  RESULTS: Midterm Math      [ANALYTICS]  |
+------------------------------------------+
|  Avg Score: 85/100 | Passing: 90%        |
+------------------------------------------+
|  [ SCORES ] [ ITEM ANALYSIS ] [ MPS ]    |
|  +------------------------------------+  |
|  | Student    | Score | Status | Action |  |
|  | Dela Cruz  | 88    | PASS   | [VIEW] |  |
|  +------------------------------------+  |
+------------------------------------------+
```

## 6.9 Students Needing Attention

Purpose: Identify students with low or at-risk performance.

Steps:

1. Open **Students Needing Attention**.
2. Review flagged students and weak areas.
3. Plan interventions (review sessions, remediation tasks).

Figure 6.9 - Students Needing Attention list with score indicators:
```
+------------------------------------------+
|  STUDENTS NEEDING ATTENTION      [WARN]  |
+------------------------------------------+
|  Name        | Reason          | Subject |
|  Reyes, L.   | Low MPS (<75%)  | Math    |
|  Cruz, P.    | Time Issues     | Science |
+------------------------------------------+
```

## 6.10 Questions Needing Review

Purpose: Detect problematic questions based on result patterns.

Steps:

1. Open **Questions Needing Review**.
2. Inspect low-correct-rate items.
3. Check ambiguity, key validity, and difficulty balance.
4. Revise question bank entries accordingly.

Figure 6.10 - Questions flagged for review:
```
+------------------------------------------+
|  QUESTIONS NEEDING REVIEW     [REVIEWS]  |
+------------------------------------------+
|  Question Text     | Metric    | Action  |
|  Q5: Complex calc  | Diff: 0.1 | [EDIT]  |
+------------------------------------------+
```

## 6.11 Student Answer Details

Purpose: Inspect individual responses for detailed feedback.

Steps:

1. Open a student record from results.
2. Go to **Student Answer Details**.
3. Review selected answers, score distribution, and mistakes.
4. Use insights for targeted support.

Figure 6.11 - Detailed student answer breakdown:
```
+------------------------------------------+
|  STUDENT: Dela Cruz, Juan  EXAM: Math    |
+------------------------------------------+
|  Q1: What is...?                         |
|  Student Answer: (A) Correct             |
|  Score: 1/1                              |
+------------------------------------------+
|  Q2: Essay Response...                   |
|  [ Student text goes here... ]           |
|  Grade: [___]/10  Comment: [________]    |
+------------------------------------------+
```

## 6.12 Create Task and Subject Tasks

Purpose: Manage non-exam requirements.

Steps:

1. Open **Create Task**.
2. Enter task title, instructions, deadline, and rubric.
3. Publish task under the appropriate subject.
4. View all tasks in **Subject Tasks**.

Figure 6.12 - Task creation form and task list:
```
+------------------------------------------+
|  CREATE NEW TASK             [ASSIGN]    |
+------------------------------------------+
|  Title: [______________________________] |
|  Due Date: [YYYY-MM-DD HH:MM]            |
|  Points: [50]  [ATTACH FILES]            |
|  [ SELECT STUDENTS / SECTIONS ]          |
|  [ PUBLISH TASK ]                        |
+------------------------------------------+
```

## 6.13 Task Submission Review

Purpose: Evaluate and record student task outputs.

Steps:

1. Open **Task Submission**.
2. Filter by task/class.
3. Review submitted files or answers.
4. Open **Task Submission Details** for per-student grading.
5. Save feedback and scores.

Figure 6.13 - Task submission review and grading screen:
```
+------------------------------------------+
|  TASK: Research Paper 1      [VIEWING]   |
+------------------------------------------+
|  Filter: [All V] [Search Student]        |
+------------------------------------------+
|  Student    | Submitted | Score | Action |
|  Santos, J. | Yes (Late)| 45/50 | [EDIT] |
|  Cruz, A.   | No        | --/50 | [REMD] |
+------------------------------------------+
```

## 6.14 Attendance Scanner

Purpose: Record attendance efficiently.

Steps:

1. Open **Attendance Scanner**.
2. Activate camera/scanner input.
3. Scan student code/ID.
4. Confirm successful attendance capture.

Figure 6.14 - Attendance scanner interface during scan:
```
+------------------------------------------+
|  ATTENDANCE SCANNER          [SCANNER]   |
+------------------------------------------+
|  +------------------------------------+  |
|  |          [ CAMERA VIEW ]           |  |
|  |         (Scanning QR...)           |  |
|  +------------------------------------+  |
|  Last Scanned: Dela Cruz, Juan [PRESENT] |
+------------------------------------------+
```

## 6.15 Attendance Records

Purpose: Monitor daily and historical attendance.

Steps:

1. Open **Attendance Records**.
2. Select date range, class, or subject.
3. Review present/absent/late counts.
4. Export or log attendance as needed.

Figure 6.15 - Attendance records table and filters:
```
+------------------------------------------+
|  ATTENDANCE RECORDS         [CHECKLIST]  |
+------------------------------------------+
|  Subject: [Math V] Date: [Range V]       |
+------------------------------------------+
|  > 2026-04-05: Session 1 (Present: 40)   |
|  v 2026-04-04: Session 1 (Present: 38)   |
|    | Student | Status  | Time     |      |
|    | Juan D. | Present | 07:30 AM |      |
+------------------------------------------+
```

## 6.16 Teacher Profile and Settings

Purpose: Manage personal account information.

Steps:

1. Open **Teacher Profile** or **Settings**.
2. Update personal details.
3. Change password regularly for security.
4. Save changes and re-login if prompted.

Figure 6.16 - Teacher profile and account settings panel:
```
+------------------------------------------+
|  TEACHER PROFILE              [SCHOOL]   |
+------------------------------------------+
|  [ IMAGE ] | Name: Juan Dela Cruz        |
|  [ EDIT  ] | Email: juan@ncnhs.edu       |
+------------------------------------------+
|  Personal Info | Settings | Password     |
|  Theme: [Default V]  [SAVE CHANGES]      |
+------------------------------------------+
```

---

## 7. Troubleshooting Guide

### 7.1 Page Does Not Load

- Check internet connection.
- Refresh browser.
- Clear browser cache.
- Try another browser.

### 7.2 Unable to Save Exam/Task

- Verify all required fields are complete.
- Check if session expired.
- Re-login and try again.

### 7.3 Missing Student Data

- Confirm class/section filter is correct.
- Verify student enrollment status in admin records.

### 7.4 Scanner Not Working

- Allow camera permissions in browser.
- Ensure camera is not used by other applications.
- Use a supported browser (Chrome/Edge preferred).

---

## 8. Frequently Asked Questions (FAQ)

### Q1: Can I edit an exam after publishing?

Answer: Yes, if the exam has not started yet. If already active or completed, create a revised version to preserve records.

### Q2: Where can I view low-performing students?

Answer: Use **Students Needing Attention** and **Student Performance** pages.

### Q3: Where do I check item quality?

Answer: Use **Item Analysis** and **Questions Needing Review** pages.

### Q4: Can I archive old exams?

Answer: Yes, use **Manage Exams** and **Archived Exam Results**.

---

## 9. Data Privacy and Security Reminders

- Keep credentials private and never share your account.
- Always log out on shared devices.
- Access student data only for academic purposes.
- Follow school and institutional privacy policies.
- Report suspicious access or data issues to the system administrator immediately.

---

## 10. Appendix: Screenshot and Figure Checklist

Use this checklist while building your final guided book layout.

- [x] Figure 3.1 Login page in browser
- [x] Figure 4.1 Teacher login form
- [x] Figure 5.1 Teacher dashboard navigation
- [x] Figure 6.1 Teacher Subjects
- [x] Figure 6.2 Teacher Class List
- [x] Figure 6.3 Create Exam form
- [x] Figure 6.4 Question Bank
- [x] Figure 6.5 Manage Exams
- [x] Figure 6.6 Preview/Publish Exam
- [x] Figure 6.7 Exam session monitor
- [x] Figure 6.8 Exam results dashboard
- [x] Figure 6.9 Students Needing Attention
- [x] Figure 6.10 Questions Needing Review
- [x] Figure 6.11 Student Answer Details
- [x] Figure 6.12 Create Task/Subject Tasks
- [x] Figure 6.13 Task Submission review
- [x] Figure 6.14 Attendance Scanner
- [x] Figure 6.15 Attendance Records
- [x] Figure 6.16 Teacher Profile/Settings

---

## Suggested Next Formatting Pass (Optional)

For a print-style manual similar to your sample pages, you can later add:

- Custom page header with school logo and department name
- Consistent section title styling (e.g., 1.0, 2.0, 3.0 format)
- Bordered page body and figure captions
- Numbered screenshot callouts
- "Message from the Team" closing page
