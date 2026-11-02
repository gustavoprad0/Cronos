@echo off
echo Cronos - iniciando ambiente de desenvolvimento
call npm run dev
if errorlevel 1 pause
