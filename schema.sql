-- Author: Paul Rawson & Christian Crumbaker
-- CS440 Ski Project
-- Basic table creation

USE ski_league;

-- USERS
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'coach', 'skier') NOT NULL,
    team_id INT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
        ON DELETE SET NULL
);

-- TEAMS
CREATE TABLE teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) UNIQUE NOT NULL,
    coach_id INT NULL,
    FOREIGN KEY (coach_id) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- COURSES
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) UNIQUE NOT NULL
);

-- RACES
CREATE TABLE races (
    race_id INT AUTO_INCREMENT PRIMARY KEY,
    race_name VARCHAR(100),
    race_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_id INT NOT NULL,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    status ENUM('scheduled', 'canceled') NOT NULL DEFAULT 'scheduled',
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE,
    FOREIGN KEY (team1_id) REFERENCES teams(team_id)
        ON DELETE CASCADE,
    FOREIGN KEY (team2_id) REFERENCES teams(team_id)
        ON DELETE CASCADE
);

-- RACE RESULTS
CREATE TABLE race_results (
    race_id INT,
    user_id INT,
    time_seconds INT,
    PRIMARY KEY (race_id, user_id),
    FOREIGN KEY (race_id) REFERENCES races(race_id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
