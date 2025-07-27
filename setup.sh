#!/bin/bash

echo "Heroku Auto Scheduler Setup Script"
echo "=================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo
    echo "Please install Node.js first:"
    echo "1. Go to https://nodejs.org/"
    echo "2. Download and install the LTS version"
    echo "3. Restart your terminal"
    echo "4. Run this script again"
    echo
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not available!"
    echo "Please make sure Node.js is properly installed."
    exit 1
fi

echo "Node.js and npm are installed!"
echo

# Install dependencies
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo
echo "Dependencies installed successfully!"
echo

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo
    echo "IMPORTANT: Please edit the .env file and add your Heroku API token!"
    echo
fi

# Build the project
echo "Building the TypeScript project..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build the project!"
    exit 1
fi

echo
echo "Setup completed successfully!"
echo
echo "Next steps:"
echo "1. Edit the .env file and add your Heroku API token"
echo "2. Configure your app names and schedules"
echo "3. Run: npm run dev (for development)"
echo "4. Run: npm start (for production)"
echo
