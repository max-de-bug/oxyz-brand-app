# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install necessary build tools for NestJS dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

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

# Copy package files
COPY package*.json ./

# Install production dependencies only with fallback
RUN npm ci --only=production --verbose || npm install 

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle-generate ./drizzle-generate

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["node", "dist/main"] 