FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends wget openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --include=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npx tsc

RUN npm prune --production

RUN mkdir -p public/images/properties

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate 2>/dev/null; node dist/index.js"]
