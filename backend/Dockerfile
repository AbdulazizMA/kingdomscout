FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache wget

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
