
# Analytics Dashboard API Documentation

This document describes the API endpoints available in the Analytics Dashboard application.

## Importing the API Specification

1. Download Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
2. Open Postman
3. Click on "Import" button
4. Select the `postman-collection.json` file
5. The collection will be imported with all endpoints configured

## Available Endpoints

### Users
- `GET /api/users` - Retrieve all users

### Sessions
- `GET /api/sessions` - Retrieve all sessions
- `GET /api/sessions/report` - Generate a sessions report with optional filters

### Questions
- `GET /api/questions` - Retrieve all questions
- `GET /api/questions/report` - Generate a questions report with optional filters

### Metrics
- `GET /api/metrics/daily` - Retrieve daily metrics

### Feedback
- `GET /api/feedback` - Retrieve all feedback entries
- `GET /api/feedback/{feedbackId}` - Retrieve specific feedback by ID

### Translations
- `GET /api/translations/{feedbackId}` - Retrieve translations for specific feedback

## Environment Variables

The collection uses the following environment variables:
- `baseUrl` - Base URL of the API (default: http://localhost:5173)
- `userId` - User ID for filtering
- `sessionId` - Session ID for filtering
- `feedbackId` - Feedback ID for specific feedback requests
- `startDate` - Start date for date range filtering (ISO format)
- `endDate` - End date for date range filtering (ISO format)
- `searchText` - Text for searching questions

## Response Formats

All endpoints return JSON responses with appropriate HTTP status codes.
