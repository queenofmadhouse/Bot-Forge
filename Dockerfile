FROM node:16-alpine

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose the port that the app will run on
EXPOSE 8080 3000 3001 3002 3003 3004

# Default command
CMD ["node", "index.js"]
