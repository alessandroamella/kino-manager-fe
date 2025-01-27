#!/bin/bash

# Define variables
PM2_NAME="Kino Manager FE"
BRANCH="master"

# Update the repository
echo "Pulling latest changes from $BRANCH branch..."
git pull origin "$BRANCH"

# Install dependencies
echo "Installing dependencies..."
pnpm i

# Build the project
echo "Building the project..."
pnpm build

# Restart the application
echo "Restarting PM2 process: $PM2_NAME..."
pm2 restart "$PM2_NAME"

echo "Deployment completed successfully!"
