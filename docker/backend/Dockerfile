# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install necessary build tools for NestJS dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install necessary build tools in production stage as well
RUN apk add --no-cache python3 make g++ git

# Copy package files from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production || npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist/ ./dist/

# Create and copy drizzle-generate directory if it exists
RUN mkdir -p ./drizzle-generate/
# Use a shell command to handle the copy that might fail
RUN if [ -d "/app/drizzle-generate" ]; then \
      cp -r /app/drizzle-generate/* ./drizzle-generate/ || true; \
    fi

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["node", "dist/main"] 