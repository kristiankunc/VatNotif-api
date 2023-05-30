-- Create database
CREATE DATABASE vatnotif;

-- Use the newly created database
USE vatnotif;

-- Create table discord_notifications
CREATE TABLE discord_notifications (
  cid INT,
  webhook_url VARCHAR(2000)
);

-- Create table ignored_cids
CREATE TABLE ignored_cids (
  cid INT
);

-- Create table sessions
CREATE TABLE sessions (
  session_id VARCHAR(64),
  access_token VARCHAR(2000),
  refresh_token VARCHAR(1500),
  created_at TIMESTAMP
);

-- Create table watched_callsigns
CREATE TABLE watched_callsigns (
  cid INT,
  callsign VARCHAR(10)
);
