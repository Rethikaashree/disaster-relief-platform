#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing OS system packages (Tesseract OCR)..."
apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-eng libtesseract-dev || true

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt
