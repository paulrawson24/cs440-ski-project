# CS440 Ski Project  
Software Design IV – Community Ski Race Management System  

## Project Overview

The Community Ski Race Management System is a web-based application designed to support the organization and operation of a community ski racing league. The system allows league administrators, coaches, and skiers to manage teams, schedule races, record results, and view race statistics.

The primary goal of this project is to streamline administrative tasks while providing skiers and coaches with easy access to team information, race schedules, and performance results.

This project is developed as part of **CS440 – Software Design IV** and follows Agile development practices.

---

## User Roles

The system supports three user roles:

- **League Admin**
  - Create teams
  - Assign skiers and coaches
  - Create courses
  - Schedule races
  - Enter race results
  - Manage notifications

- **Coach**
  - View team roster
  - View race schedules
  - View race results
  - Monitor team performance

- **Skier**
  - View team assignment
  - View upcoming races
  - View personal race results
  - Receive notifications

---

## System Features

- User registration and authentication
- Role-based access control
- Team creation and assignment
- Course management
- Race scheduling with conflict detection
- Race result entry
- Automatic team total calculation
- Winner determination (lowest combined time)
- Notifications for upcoming or rescheduled races
- Database-backed persistent storage

---

## Tech Used

- React
- Python or Java
- MySQL

- VS Code
- MySQL Workbench

---

## Database Design

Core database entities include:

- Users
- Teams
- Skiers
- Coaches
- Courses
- Races
- Race Results

Relationships enforce:
- One coach per team
- Two skiers per team
- One team per skier per season
- Race conflict detection

```bash
git clone https://github.com/your-repo/cs440-ski-project.git
cd cs440-ski-pr
