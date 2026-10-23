@echo off
echo ==============================================
echo   Memulai POS ERTIGA (Mode Pengembangan)
echo ==============================================
start "POS Backend Server :3001" cmd /k "node --watch server/server.js"
start "POS Kasir Desktop :5173" cmd /k "npm --prefix client run dev"
start "POS E-Commerce Web :5174" cmd /k "npm --prefix web run dev"
echo.
echo Semua layanan sedang dijalankan:
echo - POS Kasir Desktop: http://localhost:5173
echo - Website E-Commerce: http://localhost:5174
echo - API Backend: http://localhost:3001
echo ==============================================
