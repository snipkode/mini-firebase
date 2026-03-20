# Mini Firebase Docker Image
FROM node:18-alpine

# Install dependencies
WORKDIR /app

# Copy package files
COPY api/package*.json ./api/

# Install dependencies
WORKDIR /app/api
RUN npm install --production

# Copy application files
COPY api/ ./api/
COPY sdk/ ./sdk/

# Create data and logs directories
RUN mkdir -p /app/data /app/logs /app/backups

# Set working directory
WORKDIR /app/api

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]
