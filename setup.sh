#!/usr/bin/env bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Particle0 Development Environment Setup ===${NC}"

# Check for prerequisites
echo -e "\n${BLUE}Checking prerequisites...${NC}"

# Check Python version
if command -v python &> /dev/null; then
  PYTHON_VERSION=$(python --version | cut -d' ' -f2)
  echo -e "${GREEN}✓ Python $PYTHON_VERSION is installed${NC}"
else
  echo -e "${RED}✗ Python 3.9+ is required but not found${NC}"
  echo "Please install Python 3.9 or higher and try again."
  exit 1
fi

# Check Node.js version
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✓ Node.js $NODE_VERSION is installed${NC}"
else
  echo -e "${RED}✗ Node.js is required but not found${NC}"
  echo "Please install Node.js (see .nvmrc for version) and try again."
  exit 1
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  echo -e "${GREEN}✓ pnpm $PNPM_VERSION is installed${NC}"
else
  echo -e "${RED}✗ pnpm is required but not found${NC}"
  echo "Installing pnpm..."
  npm install -g pnpm
  echo -e "${GREEN}✓ pnpm installed successfully${NC}"
fi

# Install frontend dependencies
echo -e "\n${BLUE}Setting up frontend...${NC}"
pnpm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Set up backend
echo -e "\n${BLUE}Setting up backend...${NC}"
cd backend

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python -m venv venv
  echo -e "${GREEN}✓ Virtual environment created${NC}"
else
  echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cat > .env << EOF
PROJECT_NAME=Particle0
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://particle0.vercel.app"]
EOF
  echo -e "${GREEN}✓ .env file created${NC}"
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Go back to root directory
cd ..

echo -e "\n${GREEN}=== Setup complete! ===${NC}"
echo -e "To start the development servers:"
echo -e "  1. Frontend: ${BLUE}pnpm run dev:frontend${NC}"
echo -e "  2. Backend: ${BLUE}cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000${NC}"
echo -e "  3. Or both: ${BLUE}pnpm run dev:all${NC} (after activating the backend venv)"
echo -e "\nHappy coding! 🚀"
