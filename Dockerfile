# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
# ollama run llama3 Start
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose app port
EXPOSE 3000

# Command to run
CMD ["npm", "start"]