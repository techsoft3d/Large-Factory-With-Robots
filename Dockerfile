# Use an official Node.js runtime as a base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# # Expose the port your app runs on
EXPOSE 3000

# Start the Node.js server and allow dynamic PORT setting
CMD ["sh", "-c", "node app.js"]