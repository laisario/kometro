#!/bin/bash

# Frontend Test Runner
echo "🧪 Running Frontend Tests..."
echo "================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run tests
echo "🚀 Starting test suite..."
npm test

echo "================================"
echo "✅ Tests completed!"
