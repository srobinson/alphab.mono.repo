#!/bin/bash

# Script to run commands for Turborepo integration

command=$1

case $command in
  dev)
    python -m uvicorn particle0_backend.main:app --reload --port 8000
    ;;
  build)
    echo "Building particle0-backend..."
    # Add build commands if needed
    ;;
  lint)
    flake8 .
    ;;
  format)
    black .
    ;;
  test)
    python -m pytest
    ;;
  *)
    echo "Unknown command: $command"
    exit 1
    ;;
esac
