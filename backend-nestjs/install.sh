#!/bin/bash

echo "🚀 Installing North Wollo Tourism Backend"
echo ""

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "Next steps:"
    echo "1. npm run prisma:generate"
    echo "2. npm run prisma:migrate"
    echo "3. npm run prisma:seed"
    echo "4. npm run start:dev"
else
    echo ""
    echo "❌ Installation failed!"
    exit 1
fi
