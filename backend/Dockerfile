FROM node:20-alpine

WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Install ALL dependencies (need typescript for build)
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create directories
RUN mkdir -p public/images/properties

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate 2>/dev/null; node dist/index.js"]
