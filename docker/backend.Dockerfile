FROM node:18-alpine as base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    opencv \
    opencv-dev \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    curl

WORKDIR /app/backend

# Production build stage
FROM base as builder

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

# Production runtime stage
FROM base as production

COPY backend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src ./src

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["npm", "start"]

# Development stage
FROM base as development

RUN npm install -g nodemon

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["npm", "run", "dev"]
