# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend-build

# Copy frontend dependency files
# We assume the build context is the repository root
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ .

# Build the frontend
# Set the API URL to be relative since it's served by the same backend
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Setup the backend
FROM node:20-alpine

WORKDIR /app

# Copy backend dependency files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --production

# Copy backend source code
COPY backend/ .

# Copy built frontend assets from the previous stage
# The backend is configured to serve static files from ./public
COPY --from=frontend-builder /frontend-build/dist ./public

ENV PORT=5001
EXPOSE 5001

CMD ["npm", "start"]
