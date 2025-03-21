# Use the official Node.js 20 base image
FROM node:20

# Install nodemon globally
RUN npm install -g nodemon

# Set the working directory
WORKDIR /app

# Configure apt to retry downloads and use a different mirror
RUN echo 'Acquire::Retries "3";' > /etc/apt/apt.conf.d/80retries && \
    echo "deb http://cloudfront.debian.net/debian bookworm main" > /etc/apt/sources.list

# Install system dependencies in smaller groups with retries
RUN apt-get update && \
    apt-get install -y curl python3 python3-pip && \
    rm -rf /var/lib/apt/lists/* && \
    ln -s /usr/bin/python3 /usr/bin/python

# Install ffmpeg separately as it has many dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set the ffmpeg path
ENV FFMPEG_PATH="/usr/bin/ffmpeg"

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Verify installation
RUN yt-dlp --version

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 3003

# Set the default command
CMD ["npm", "run", "dev"]
