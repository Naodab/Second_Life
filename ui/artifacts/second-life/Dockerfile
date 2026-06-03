# syntax=docker/dockerfile:1
# Build Vite UI; phục vụ file tĩnh bằng static-web-server (chỉ trong Docker network).
# Traefik trên VPS là reverse proxy duy nhất — không cài nginx trên host.
# Context: thư mục ui/

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib lib
COPY artifacts/second-life artifacts/second-life

ARG VITE_BACKEND_URL=
ARG VITE_CLOUDINARY_CLOUD_NAME=
ARG VITE_CLOUDINARY_UPLOAD_PRESET=
ARG VITE_CLOUDINARY_MAX_VIDEO_BYTES=
ARG BASE_PATH=/

ENV NODE_ENV=production \
    PORT=5173 \
    BASE_PATH=${BASE_PATH} \
    VITE_BACKEND_URL=${VITE_BACKEND_URL} \
    VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME} \
    VITE_CLOUDINARY_UPLOAD_PRESET=${VITE_CLOUDINARY_UPLOAD_PRESET} \
    VITE_CLOUDINARY_MAX_VIDEO_BYTES=${VITE_CLOUDINARY_MAX_VIDEO_BYTES}

RUN pnpm install --frozen-lockfile \
    && pnpm --filter @workspace/second-life run build

FROM ghcr.io/static-web-server/static-web-server:2-alpine
COPY --from=builder /app/artifacts/second-life/dist/public /public
EXPOSE 80
CMD ["--root", "/public", "--host", "0.0.0.0", "--port", "80", "--page-fallback", "index.html", "--compression", "true"]
