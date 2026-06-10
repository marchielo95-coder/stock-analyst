#!/bin/bash
# Stock Analyst — arranca backend y frontend en paralelo
echo "🚀 Iniciando Stock Analyst..."

# Backend
cd "$(dirname "$0")/server" && node index.js &
BACKEND_PID=$!

# Frontend
cd "$(dirname "$0")" && npm run dev &
FRONTEND_PID=$!

echo "✅ Backend en http://localhost:3002"
echo "✅ Frontend en http://localhost:5173"
echo "   Presiona Ctrl+C para detener todo"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
