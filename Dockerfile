# Dockerfile for Railway deployment
# Provides system libraries needed by native Node modules
# (canvas, skia-canvas, better-sqlite3, @discordjs/opus)

FROM node:18-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    python3 \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    pkg-config \
    libopus-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

CMD ["node", "index.js"]
