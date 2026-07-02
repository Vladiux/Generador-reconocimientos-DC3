@echo off
REM Iniciar Generador DC-3 y Reconocimientos AGASI — Windows
cd /d "%~dp0\.."
call venv\Scripts\activate
python app.py
pause
