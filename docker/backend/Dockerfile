# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install necessary build tools for NestJS dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

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
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle-generate ./drizzle-generate

# Expose the port the app runs on
EXPOSE 3001

# Start the application in production mode
CMD ["npm", "run", "start:prod"] 