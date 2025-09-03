# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./

# Copy the rest of the code
COPY . .

# Expose app port
EXPOSE 3000

# Command to run
CMD ["npm", "run", "dev"]