-- Author: Paul Rawson
-- CS440 Ski Project
-- Basic table creation

USE ski_league;

-- USERS
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(20)
);

-- TEAMS
CREATE TABLE teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100)
);

-- COURSES
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100)
);

-- RACES
CREATE TABLE races (
    race_id INT AUTO_INCREMENT PRIMARY KEY,
    race_name VARCHAR(100),
    race_date DATE,
    start_time TIME,
    end_time TIME,
    course_id INT
);

-- RACE RESULTS
CREATE TABLE race_results (
    race_id INT,
    user_id INT,
    time_seconds INT
);