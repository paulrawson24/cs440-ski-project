-- Author: Christian Crumbaker
-- CS440 Ski Project
-- Inserting user data

USE ski_league;

-- ADMIN
INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES ('Admin', 'User', 'admin@skileague.com', '$2b$12$zJHyqF5SxJyUWF5346a37.dMlPMon1NWs4LiuAFPZ29.AgUGvdilu', 'admin');

-- COACHES
INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES 
('Anna', 'Berg', 'anna@skileague.com', '$2b$12$KMN5h4WmJ.pKGKysrUyEreUBOr8VuOxe2dYVgSvuE9UwSAprh6CJy', 'coach'),
('Eric', 'Novak', 'eric@skileague.com', '$2b$12$XbYTW4/JXkwJCtiDDayAF.DThXJkc8gyh3lvAUpnngl1ENBqqdxbq', 'coach');
