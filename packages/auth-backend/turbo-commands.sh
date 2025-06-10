#!/bin/bash

# Script to run commands for Turborepo integration

command=$1

case $command in
  dev)
    python -m uvicorn app:app --reload --port 8002
    ;;
  build)
    echo "Building auth-backend..."
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
