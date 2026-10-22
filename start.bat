@echo off
title Shifra - Starting...
color 0A

echo.
echo  ==========================================
echo   SHIFRA Virtual Assistant - Starting...
echo  ==========================================
echo.

:: Step 1: Start MongoDB
echo [1/3] Checking MongoDB...
net start MongoDB >nul 2>&1
echo  MongoDB is running.

:: Step 2: Start Backend
echo [2/3] Starting Backend Server...
start "Shifra Backend" cmd /k "cd /d "C:\Users\ankur\OneDrive\Desktop\8.Virtual Assistant\backend" && npm run dev"

:: Wait for backend to start
timeout /t 4 /nobreak >nul

:: Step 3: Open Browser
echo [3/3] Opening Shifra in Chrome...
start chrome "http://localhost:5000/login.html"

echo.
echo  ==========================================
echo   Shifra is ready! 
echo   Remember to reload the Chrome Extension.
echo  ==========================================
echo.
pause
