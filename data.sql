-- Author: Christian Crumbaker
-- CS440 Ski Project
-- Inserting user data

USE ski_league;

-- ADMIN
INSERT INTO users (first_name, last_name, email, password, role)
VALUES ('Admin', 'User', 'admin@skileague.com', 'admin123', 'admin');

-- COACHES
INSERT INTO users (first_name, last_name, email, password, role)
VALUES 
('Anna', 'Berg', 'anna@skileague.com', 'coach123', 'coach'),
('Eric', 'Novak', 'eric@skileague.com', 'coach123', 'coach');