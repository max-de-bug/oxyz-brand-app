# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install necessary build tools for NestJS dependencies
RUN apk add --no-cache python3 make g++ git

# Debug: List directory contents to verify what's available
RUN ls -la

# Copy package.json (if it exists)
COPY package.json ./
# Copy package-lock.json (if it exists)
COPY package-lock.json ./

# Debug: Verify package.json exists
RUN ls -la && cat package.json || echo "package.json not found"

# Install dependencies with more verbose output and fallback to npm install if ci fails
RUN npm ci --verbose || npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install necessary build tools in production stage as well
RUN apk add --no-cache python3 make g++ git

# Copy package files from builder stage to ensure they exist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies only with fallback
RUN npm ci --only=production --verbose || npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle-generate ./drizzle-generate || echo "No drizzle-generate directory found"

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["node", "dist/main"] 