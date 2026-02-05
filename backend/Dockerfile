FROM node:20-alpine

WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Create directories
RUN mkdir -p public/images/properties

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate 2>/dev/null; node dist/index.js"]
