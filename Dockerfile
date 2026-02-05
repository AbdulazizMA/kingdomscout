FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other dependencies
RUN apt-get update && apt-get install -y openssl libssl-dev python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build backend
RUN cd backend && npx prisma generate && npx tsc

# Build frontend
RUN cd frontend && npm run build

# Make start script executable
RUN chmod +x backend/start.sh

# Expose port
EXPOSE 3001

ENV NODE_ENV=production

# Stay in /app (start.sh will navigate as needed)
CMD ["/app/backend/start.sh"]
