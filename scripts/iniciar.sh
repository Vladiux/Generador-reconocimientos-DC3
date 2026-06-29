#!/bin/bash
# Iniciar Generador de Certificados AGASI — Linux
cd "$(dirname "$0")"
source venv/bin/activate
python app.py
