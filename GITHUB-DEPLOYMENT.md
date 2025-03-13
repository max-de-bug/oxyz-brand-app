# GitHub Deployment Guide for OXYZ Brand App

This document provides instructions for setting up GitHub Actions and deploying the OXYZ Brand App using GitHub's CI/CD pipeline.

## Prerequisites

1. A GitHub repository for your project
2. A server with Docker and Docker Compose installed
3. SSH access to the server
4. Supabase account with a PostgreSQL database (already set up)
5. Cloudinary account for image storage

## Setting Up GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:

   ### Server Access Secrets

   - `SSH_HOST`: The hostname or IP address of your server
   - `SSH_USERNAME`: The SSH username for your server
   - `SSH_PRIVATE_KEY`: The private SSH key for authentication
   - `SSH_PORT`: The SSH port (usually 22)
   - `DEPLOY_PATH`: The path on the server where your project is located

   ### Database Secrets (Supabase)

   - `POSTGRES_HOST`: Your Supabase PostgreSQL host (e.g., aws-0-eu-central-1.pooler.supabase.com)
   - `POSTGRES_USER`: Your Supabase PostgreSQL username
   - `POSTGRES_PASSWORD`: Your Supabase PostgreSQL password
   - `POSTGRES_DB`: Your Supabase PostgreSQL database name (usually postgres)
   - `POSTGRES_PORT`: Your Supabase PostgreSQL port (usually 6543)
   - `DATABASE_URL`: The complete PostgreSQL connection URL

   ### Cloudinary Secrets

   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

## GitHub Package Visibility

For the GitHub Container Registry to work properly, you need to configure package visibility:

1. Go to your repository on GitHub
2. Navigate to Settings > Actions > General
3. Under "Workflow permissions", select "Read and write permissions"
4. Save the changes

Additionally, you may need to configure package visibility:

1. Go to your GitHub profile
2. Click on "Packages"
3. For each package created by your workflow, click on the package name
4. Go to "Package settings"
5. Under "Danger Zone", change the visibility to "Public" if you want it to be accessible without authentication

## GitHub Actions Workflows

This project includes two GitHub Actions workflows:

1. **Docker Build and Deploy** (`.github/workflows/docker-build.yml`):

   - Builds the Docker images for the frontend and backend
   - Pushes the images to GitHub Container Registry

2. **Deploy to Server** (`.github/workflows/deploy.yml`):
   - Triggered after the Docker Build and Deploy workflow completes successfully
   - Connects to your server via SSH
   - Updates the Docker Compose configuration
   - Pulls the latest Docker images
   - Creates/updates the `.env` file with the necessary environment variables from GitHub secrets
   - Restarts the Docker containers

## Manual Deployment

You can also trigger the deployment manually:

1. Go to your repository on GitHub
2. Navigate to Actions
3. Select either "Docker Build and Deploy" or "Deploy to Server" workflow
4. Click "Run workflow" and select the branch you want to deploy

## Initial Server Setup

Before the first deployment, you need to set up your server:

1. Install Docker and Docker Compose on your server
2. Create a directory for your project
3. Clone your repository to this directory
4. Copy the necessary files:
   - `docker-compose.yml`
   - `docker/nginx/conf.d/default.conf`

## Troubleshooting

- **Image Pull Errors**: Make sure your server has access to GitHub Container Registry and is authenticated
- **SSH Connection Issues**: Verify your SSH credentials and server firewall settings
- **Database Connection Problems**: Check the Supabase connection details in your GitHub secrets
- **Container Startup Failures**: Check the container logs using `docker-compose logs -f`
- **GitHub Token Issues**: If you encounter authentication problems with GitHub Container Registry, make sure your GitHub token has the correct permissions and that you've configured the package visibility settings correctly
