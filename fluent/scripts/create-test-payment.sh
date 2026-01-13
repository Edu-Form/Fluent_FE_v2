#!/bin/bash
# Script to create a test payment in the database
# Usage: ./scripts/create-test-payment.sh [studentName] [amount]

STUDENT_NAME=${1:-"TEST_STUDENT"}
AMOUNT=${2:-5000}

echo "Creating test payment..."
echo "Student: $STUDENT_NAME"
echo "Amount: $AMOUNT KRW"
echo ""

curl -X POST http://localhost:3000/api/payment/link \
  -H "Content-Type: application/json" \
  -d "{\"studentName\":\"$STUDENT_NAME\",\"amount\":$AMOUNT}" \
  -s | jq '.'

echo ""
echo "✅ Test payment created!"
echo "Run 'node scripts/check-payments-in-db.js' to verify"
