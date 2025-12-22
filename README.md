# Full-Stack Skeleton Project

This project is a skeleton for a full-stack application using React, Tailwind CSS, Express, and MongoDB.

## Project Structure

```
/
├── backend/            # Express Server
│   ├── src/
│   │   ├── config/     # Database configuration
│   │   ├── controllers/# Request handling
│   │   ├── services/   # Business logic
│   │   ├── repositories/# Database abstraction
│   │   ├── models/     # Mongoose models
│   │   └── routes/     # API routes
│   └── .env            # Environment variables
└── frontend/           # React Frontend (Vite)
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── services/   # API service layer
    │   └── hooks/      # Custom React hooks
    └── vite.config.js  # Vite configuration with Tailwind CSS v4
```

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB installed and running (default: `mongodb://localhost:27017/skeleton-db`)

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- **Separation of Concerns**: Backend follows the Controller-Service-Repository-Model pattern.
- **Service Layer**: Frontend logic is separated from UI components using a dedicated service layer.
- **Tailwind CSS v4**: Modern styling with the latest Tailwind CSS features.
- **Reusable Components**: Example components like `Button` and `Card` are provided.
- **RESTful API**: Complete CRUD examples for an "Item" resource.
