# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the project
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Run the production application
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Copy Next.js build artifacts and static assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# Set the private-key for the server-side JWT verification
# This should be passed during runtime or handled securely.
# For example, using Kubernetes secrets or cloud provider's secret management.
# ENV JWT_PRIVATE_KEY your_private_key_here

EXPOSE 3000

CMD ["npm", "start"]
