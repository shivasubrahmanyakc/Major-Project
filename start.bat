@echo off
echo ================================
echo  NeuralScan AI — Startup Script
echo ================================
echo.

echo [1/2] Starting Backend (FastAPI)...
start "NeuralScan Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Vite)...
start "NeuralScan Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting...
echo  Backend:  http://127.0.0.1:8000
echo  Frontend: http://localhost:5173
echo  API docs: http://127.0.0.1:8000/docs
echo.
pause
