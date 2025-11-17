#!/bin/bash

# Quick test script to verify Redis connection
# Run this after deploying or with vercel dev running

echo "Testing Redis connection..."
echo ""

# Test the test endpoint
if [ -z "$1" ]; then
  BASE_URL="http://localhost:3000"
else
  BASE_URL="$1"
fi

echo "Testing: $BASE_URL/api/test-redis"
echo ""

curl -s "$BASE_URL/api/test-redis" | jq '.' || curl -s "$BASE_URL/api/test-redis"

echo ""
echo ""
echo "Testing poll endpoint: $BASE_URL/api/birthday-poll"
echo ""

curl -s "$BASE_URL/api/birthday-poll" | jq '.' || curl -s "$BASE_URL/api/birthday-poll"

