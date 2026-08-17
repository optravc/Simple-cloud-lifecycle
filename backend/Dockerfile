FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# ── Memory control for low-RAM environments (t3.micro) ────────
ARG GOGC=100
ARG GOMAXPROCS=2
RUN GOGC=${GOGC} GOMAXPROCS=${GOMAXPROCS} \
    CGO_ENABLED=0 GOOS=linux \
    go build -ldflags="-w -s" -o /app-api ./cmd/api/main.go


FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app-api ./

USER appuser

CMD ["./app-api"]