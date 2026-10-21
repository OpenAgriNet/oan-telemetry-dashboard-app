# API Documentation

This document provides an overview of the available API endpoints.

## Feedback API (`controllers/feedback.controller.js`)

### 1. Get All Feedback
*   **Endpoint:** `GET /feedback`
*   **Description:** Retrieves a paginated list of all feedback entries. Supports searching and filtering by date range.
*   **Query Parameters:**
    *   `page` (optional, number): The page number for pagination (default: 1).
    *   `limit` (optional, number): The number of items per page (default: 10, max: 100).
    *   `search` (optional, string): A search term to filter feedback by text, question text, or answer text.
    *   `startDate` (optional, string): The start date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object containing the feedback data, pagination details, and applied filters.
    *   `400 Bad Request`: If search term is too long, date format is invalid, or start date is after end date.
    *   `500 Internal Server Error`: If there is an error fetching feedback data.

## Sessions API (`controllers/sessions.controller.js`)

### 1. Get All Sessions
*   **Endpoint:** `GET /sessions`
*   **Description:** Retrieves a paginated list of all user sessions. Supports searching and filtering by date range.
*   **Query Parameters:**
    *   `page` (optional, number): The page number for pagination (default: 1).
    *   `limit` (optional, number): The number of items per page (default: 10, max: 100).
    *   `search` (optional, string): A search term to filter sessions by session ID or user ID.
    *   `startDate` (optional, string): The start date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object with `success: true`, session data, pagination details, and applied filters.
    *   `400 Bad Request`: If search term is too long, date format is invalid, or start date is after end date.
    *   `500 Internal Server Error`: If there is an error fetching sessions data.

### 2. Get Sessions by User ID
*   **Endpoint:** `GET /sessions/user/:userId`
*   **Description:** Retrieves a paginated list of sessions for a specific user ID. Supports date filtering.
*   **Path Parameters:**
    *   `userId` (required, string): The ID of the user.
*   **Query Parameters:**
    *   `page` (optional, number): The page number for pagination (default: 1).
    *   `limit` (optional, number): The number of items per page (default: 10, max: 100).
    *   `startDate` (optional, string): The start date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object with `success: true`, user's session data, pagination details, and applied filters.
    *   `400 Bad Request`: If `userId` is invalid, date format is invalid.
    *   `500 Internal Server Error`: If there is an error fetching user sessions.

## Questions API (`controllers/questions.controller.js`)

### 1. Get All Questions
*   **Endpoint:** `GET /questions`
*   **Description:** Retrieves a paginated list of all questions. Supports searching (question text, answer text, user ID, channel) and filtering by date range.
*   **Query Parameters:**
    *   `page` (optional, number): The page number for pagination (default: 1).
    *   `limit` (optional, number): The number of items per page (default: 10, max: 100).
    *   `search` (optional, string): A search term.
    *   `startDate` (optional, string): The start date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object with `success: true`, question data, pagination details, and applied filters.
    *   `400 Bad Request`: If search term is too long, date format is invalid, or start date is after end date.
    *   `500 Internal Server Error`: If there is an error fetching questions.

### 2. Get Questions by User ID
*   **Endpoint:** `GET /questions/user/:userId`
*   **Description:** Retrieves a paginated list of questions for a specific user ID. Supports date filtering.
*   **Path Parameters:**
    *   `userId` (required, string): The ID of the user.
*   **Query Parameters:**
    *   `page` (optional, number): The page number for pagination (default: 1).
    *   `limit` (optional, number): The number of items per page (default: 10, max: 100).
    *   `startDate` (optional, string): The start date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object with `success: true`, user's question data, pagination details, and applied filters.
    *   `400 Bad Request`: If `userId` is invalid, date format is invalid.
    *   `500 Internal Server Error`: If there is an error fetching user questions.

## Users API (`controllers/user.controller.js`)

### 1. Get All Users
*   **Endpoint:** `GET /users`
*   **Description:** Retrieves a paginated list of all users with their statistics. Supports searching by user ID and filtering by date range.
*   **Query Parameters:**
    *   `page` (optional, number): The page number for pagination (default: 1).
    *   `limit` (optional, number): The number of items per page (default: 10, max: 100).
    *   `search` (optional, string): A search term to filter users by user ID.
    *   `startDate` (optional, string): The start date for filtering user activity (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering user activity (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object with `success: true`, user data, pagination details, and applied filters.
    *   `400 Bad Request`: If search term is too long, date format is invalid, or start date is after end date.
    *   `500 Internal Server Error`: If there is an error fetching users.

### 2. Get User by Username
*   **Endpoint:** `GET /users/:username`
*   **Description:** Retrieves detailed information and statistics for a specific user by their username. Supports date filtering for user activity.
*   **Path Parameters:**
    *   `username` (required, string): The username of the user.
*   **Query Parameters:**
    *   `startDate` (optional, string): The start date for filtering user activity (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering user activity (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object with `success: true`, detailed user data, and applied filters.
    *   `400 Bad Request`: If `username` is invalid, date format is invalid.
    *   `404 Not Found`: If no user is found for the given username and date range.
    *   `500 Internal Server Error`: If there is an error fetching user data.

### 3. Get User Statistics
*   **Endpoint:** `GET /users/stats`
*   **Description:** Retrieves overall user statistics and activity summary. Supports date filtering.
*   **Query Parameters:**
    *   `startDate` (optional, string): The start date for filtering statistics (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
    *   `endDate` (optional, string): The end date for filtering statistics (ISO date string YYYY-MM-DD or Unix timestamp in milliseconds).
*   **Responses:**
    *   `200 OK`: Returns a JSON object with `success: true`, overall user statistics, daily activity, and applied filters.
    *   `400 Bad Request`: If date format is invalid.
    *   `500 Internal Server Error`: If there is an error fetching user statistics. 
