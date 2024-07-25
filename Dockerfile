# Use the official Node.js base image
FROM node:18

# Install nodemon globally
RUN npm install -g nodemon

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Set the ffmpeg path
ENV FFMPEG_PATH="/usr/bin/ffmpeg"

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code to the container
COPY . .

# Expose the port used by your application (if applicable)
EXPOSE 3003

# Set the default command to run when the container starts
CMD ["npm", "run", "dev"]
