@echo off
echo ========================================================
echo   Starting LoanShield Microservices Ecosystem
echo ========================================================

start "LoanShield Microservices Cluster" cmd /k "cd backend && venv\Scripts\activate && python start_microservices.py"
start "LoanShield Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo Cluster is booting:
echo   - API Gateway:          http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)
echo   - ML Risk Service:      http://127.0.0.1:8001 (Swagger: http://127.0.0.1:8001/docs)
echo   - Application Service:  http://127.0.0.1:8002 (Swagger: http://127.0.0.1:8002/docs)
echo   - Pricing Service:      http://127.0.0.1:8003 (Swagger: http://127.0.0.1:8003/docs)
echo   - Frontend UI:          http://localhost:3000
echo.
pause
