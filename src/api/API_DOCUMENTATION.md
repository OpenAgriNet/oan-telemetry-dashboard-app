# Analytics Dashboard API Documentation

This document describes the API endpoints available in the Analytics Dashboard application.

## Importing the API Specification

1. Download Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
2. Open Postman
3. Click on "Import" button
4. Select the `postman-collection.json` file
5. The collection will be imported with all endpoints configured

## Pagination

All list endpoints support pagination with the following query parameters:
- `page` - Page number (default: 1)
- `pageSize` - Number of items per page (default: 10)

Response format for paginated endpoints:
```json
{
  "data": [], // Array of items for the current page
  "total": 0, // Total number of items
  "page": 1, // Current page number
  "pageSize": 10, // Items per page
  "totalPages": 1 // Total number of pages
}
```

## Available Endpoints

### Users
- `GET /api/users` - Retrieve all users (paginated)
  - Query params: page, pageSize

### Sessions
- `GET /api/sessions` - Retrieve all sessions (paginated)
  - Query params: page, pageSize
- `GET /api/sessions/report` - Generate a sessions report with optional filters (paginated)
  - Query params: page, pageSize, userId, startDate, endDate
- `GET /api/sessions/{sessionId}/events` - Retrieve all events for a specific session

### Questions
- `GET /api/questions` - Retrieve all questions (paginated)
  - Query params: page, pageSize
- `GET /api/questions/report` - Generate a questions report with optional filters (paginated)
  - Query params: page, pageSize, userId, sessionId, startDate, endDate, searchText

### Metrics
- `GET /api/metrics/daily` - Retrieve daily metrics

### Feedback
- `GET /api/feedback` - Retrieve all feedback entries (paginated)
  - Query params: page, pageSize
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
