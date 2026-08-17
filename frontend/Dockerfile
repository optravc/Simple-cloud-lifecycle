FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_AWS_REGION=ap-southeast-1
ARG NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-southeast-1_livhXX82E
ARG NEXT_PUBLIC_COGNITO_CLIENT_ID=4ojfv0k57ar8btdf2fimm1sjn
ARG NEXT_PUBLIC_API_URL=/api

# Set env variables so they are embedded during next build
ENV NEXT_PUBLIC_AWS_REGION=${NEXT_PUBLIC_AWS_REGION}
ENV NEXT_PUBLIC_COGNITO_USER_POOL_ID=${NEXT_PUBLIC_COGNITO_USER_POOL_ID}
ENV NEXT_PUBLIC_COGNITO_CLIENT_ID=${NEXT_PUBLIC_COGNITO_CLIENT_ID}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]