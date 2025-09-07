# Base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./

# Install dependencies (including vite if in devDependencies)
RUN npm install

# Install vite globally if you want to run it directly (optional)
RUN npm install -g vite

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Run (only serve build output)
FROM node:20-alpine

WORKDIR /app

# Copy built app from previous stage
COPY --from=build /app/. ./.

# Optionally install a lightweight server (like serve or http-server)
RUN npm install -g serve

# Expose app port
EXPOSE 5173

# RUN npm run dev 

# Command to run
# CMD ["npm", "run", "dev"]

CMD ["serve", "-s", "dist", "-l", "5173"]
