FROM node:18-alpine as base

WORKDIR /app/frontend

# Builder stage
FROM base as builder

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production stage
FROM base as production

RUN npm install -g pm2

COPY frontend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY frontend/next.config.js ./
COPY frontend/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["npm", "start"]

# Development stage
FROM base as development

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["npm", "run", "dev"]
