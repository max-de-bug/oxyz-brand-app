# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install necessary build tools for NestJS dependencies
RUN apk add --no-cache python3 make g++ git

# Debug: Show current directory contents
RUN ls -la || true

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Debug: Verify files were copied
RUN ls -la && \
    if [ ! -f "package.json" ]; then \
      echo "Error: package.json not found after copy" && exit 1; \
    fi

# Install dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install necessary runtime dependencies
RUN apk add --no-cache python3 make g++

# Copy package files from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production || npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist/ ./dist/

# Copy drizzle-generate directory if it exists
RUN mkdir -p ./drizzle-generate/
COPY --from=builder /app/drizzle-generate/ ./drizzle-generate/ 2>/dev/null || true

# Expose the port the app runs on
EXPOSE 3001

# Start the application in production mode
CMD ["npm", "run", "start:prod"] 