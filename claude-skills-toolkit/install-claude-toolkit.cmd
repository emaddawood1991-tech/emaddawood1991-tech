@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-claude-toolkit.ps1" %*
set "toolkit_exit=%ERRORLEVEL%"
echo.
if not "%toolkit_exit%"=="0" echo Installation stopped with an error. Review the message above.
pause
exit /b %toolkit_exit%

