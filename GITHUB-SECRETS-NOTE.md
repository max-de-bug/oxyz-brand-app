# GitHub Secrets for Deployment

For the Docker build and deployment workflows to function correctly, you need to set up the following GitHub secrets:

## Required for Backend Repository Access

- `PAT_TOKEN`: A Personal Access Token with `repo` scope to access the backend repository.
  - Go to GitHub Settings > Developer settings > Personal access tokens
  - Generate a new token with the `repo` scope
  - Add this token as a secret in your repository settings

## Required for Deployment

- `SSH_HOST`: The hostname or IP address of your deployment server
- `SSH_PORT`: The SSH port of your deployment server (usually 22)
- `SSH_USERNAME`: The username for SSH access
- `SSH_PRIVATE_KEY`: The private SSH key for authentication
- `DEPLOY_PATH`: The path on the server where your application should be deployed

## Database Configuration (Supabase)

- `POSTGRES_HOST`: Your Supabase PostgreSQL host
- `POSTGRES_USER`: Your Supabase PostgreSQL username
- `POSTGRES_PASSWORD`: Your Supabase PostgreSQL password
- `POSTGRES_DB`: Your Supabase PostgreSQL database name
- `POSTGRES_PORT`: Your Supabase PostgreSQL port
- `DATABASE_URL`: The full database connection string

## Cloudinary Configuration

- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

## How to Add Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add each secret with its corresponding value
