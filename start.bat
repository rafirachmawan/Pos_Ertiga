@echo off
echo Memulai POS Ertiga (Mode Pengembangan)...
start cmd /k "node server/server.js"
start cmd /k "npm --prefix client run dev"
echo Backend dan Frontend sedang dijalankan! Frontend akan tersedia di http://localhost:5173
