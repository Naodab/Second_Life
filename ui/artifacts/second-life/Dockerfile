# syntax=docker/dockerfile:1
# Build Vite UI; serve static files via static-web-server (Traefik reverse proxy on VPS).
# Context: ui/

FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
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
