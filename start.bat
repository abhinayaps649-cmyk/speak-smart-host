@echo off
echo =========================================
echo      SpeakSmart - Server Launcher
echo =========================================

echo Starting Python Flask Backend Server...
start "SpeakSmart Backend" cmd.exe /k "cd backend && title SpeakSmart Backend && python app.py"

echo Starting Python Frontend HTTP Server...
start "SpeakSmart Frontend" cmd.exe /k "title SpeakSmart Frontend && python -m http.server 8000"

echo.
echo Both servers are starting up!
echo 1. Keep the two new black windows open while using the app.
echo 2. Open http://localhost:8000 in your web browser.
echo.
pause
