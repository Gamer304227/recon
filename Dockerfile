FROM node:16-slim

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  wget \
  curl \
  libx11-xcb1 \
  libxcomposite1 \
  libxrandr2 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  fonts-liberation \
  libappindicator3-1 \
  libasound2-dev \
  libgtk-3-0

# Set working directory
WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the app
COPY . .

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
