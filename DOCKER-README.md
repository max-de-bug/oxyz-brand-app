# Docker Setup for OXYZ Brand App

This document provides instructions for setting up and running the OXYZ Brand App using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)
- Supabase account with a PostgreSQL database (already set up)

## Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd oxyz-brand-app
   ```

2. Create a `.env` file from the template:

   ```bash
   cp .env.example .env
   ```

3. The `.env` file is pre-configured with Supabase database credentials. You may need to update:
   - Cloudinary credentials: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Building and Running

1. Build and start the containers:

   ```bash
   docker-compose up -d --build
   ```

2. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost/api

## Container Structure

- **nginx**: Reverse proxy that routes traffic to the frontend and backend
- **frontend**: Next.js application
- **backend**: Node.js API server
- **database**: External Supabase PostgreSQL database (not a container)

## Managing the Containers

- View logs:

  ```bash
  docker-compose logs -f
  ```

- Stop the containers:

  ```bash
  docker-compose down
  ```

- Rebuild a specific service:
  ```bash
  docker-compose build <service-name>
  docker-compose up -d
  ```

## Database Management

The application uses a Supabase PostgreSQL database. Database management should be done through the Supabase dashboard.

## Troubleshooting

- If you encounter issues with the frontend not connecting to the backend, check that the `NEXT_PUBLIC_API_URL` environment variable is set correctly.
- For database connection issues, verify the Supabase connection details in the `.env` file.
- Check container logs for specific error messages:
  ```bash
  docker-compose logs -f <service-name>
  ```
