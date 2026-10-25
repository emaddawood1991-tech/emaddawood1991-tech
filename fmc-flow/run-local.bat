@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install Node 22 or newer from https://nodejs.org then run this again. & pause & exit /b 1)
for /f "tokens=1 delims=v." %%a in ('node -v') do set MAJOR=%%a
if %MAJOR% LSS 22 (echo Node 22 or newer is required. Please update from https://nodejs.org & pause & exit /b 1)
if not exist node_modules call npm install || (pause & exit /b 1)
if not exist dist call npm run build || (pause & exit /b 1)
start "" http://localhost:3000
echo.
echo FMC Patient Flow is starting on http://localhost:3000  (close this window to stop)
echo Login: admin / reception / super / pt.one   Password: Demo-Passw0rd!
call npm start
pause
