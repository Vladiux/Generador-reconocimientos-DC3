@echo off
REM Iniciar Generador de Certificados AGASI — Windows
cd /d "%~dp0\.."
call venv\Scripts\activate
python app.py
pause
