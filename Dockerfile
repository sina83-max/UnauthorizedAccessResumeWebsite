# Stage 1: Build frontend
FROM node:20-alpine AS frontend
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY index.html vite.config.ts tsconfig.json postcss.config.mjs ./
COPY src/ src/
COPY public/ public/
RUN pnpm build

# Stage 2: Build Go binary
FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
COPY --from=frontend /app/dist ./static/
RUN CGO_ENABLED=0 GOOS=linux go build -o portfolio-api .

# Stage 3: Minimal runtime
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=backend /app/portfolio-api .
EXPOSE 8080
CMD ["./portfolio-api"]
