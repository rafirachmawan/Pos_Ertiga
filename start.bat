@echo off
echo Starting POS System...
start cmd /k "cd server && npm start"
start cmd /k "cd client && npm run dev"
echo Both servers are starting! The frontend will be available at http://localhost:5173
