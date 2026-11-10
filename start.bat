@echo off
echo ========================================================
echo   Starting LoanShield (Backend + Frontend)
echo ========================================================

start "LoanShield Backend (FastAPI)" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "LoanShield Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://127.0.0.1:8000 (API docs: http://127.0.0.1:8000/docs)
echo.
pause
