FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# ── Fast Go compilation for constrained RAM/CPU (t3.micro) ─────
ARG GOGC=50
ARG GOMAXPROCS=1
RUN GOGC=${GOGC} GOMAXPROCS=${GOMAXPROCS} \
    CGO_ENABLED=0 GOOS=linux \
    go build -gcflags="all=-N -l" -ldflags="-w -s" -p 1 -o /app-api ./cmd/api/main.go


FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app-api ./

USER appuser

CMD ["./app-api"]