# Multi-stage build for KingdomScout
FROM node:20-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy from build stage
COPY --from=base /app/backend ./backend
COPY --from=base /app/frontend/.next ./frontend/.next
COPY --from=base /app/frontend/public ./frontend/public
COPY --from=base /app/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev
RUN cd backend && npm install --omit=dev

# Expose port
EXPOSE 3001

# Start backend (serves API)
CMD ["node", "backend/dist/index.js"]
