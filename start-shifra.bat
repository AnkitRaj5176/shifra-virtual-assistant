@echo off
title Shifra Backend
echo Starting Shifra Backend...
net start MongoDB >nul 2>&1
cd /d "C:\Users\ankur\OneDrive\Desktop\8.Virtual Assistant\backend"
npm run dev
