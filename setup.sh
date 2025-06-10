#!/usr/bin/env bash
# shellcheck disable=SC1091
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

# Check if Logto packages are installed
if ! grep -q "@logto/react" frontend/package.json; then
  echo "Installing Logto packages for frontend..."
  cd frontend && pnpm add @logto/react @logto/browser && cd ..
  echo -e "${GREEN}✓ Logto packages installed${NC}"
else
  echo -e "${GREEN}✓ Logto packages already installed${NC}"
fi

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Set up auth-frontend package
echo -e "\n${BLUE}Setting up auth-frontend package...${NC}"
cd packages/auth-frontend
if [ ! -d "node_modules" ]; then
  echo "Installing auth-frontend dependencies..."
  pnpm install
  echo -e "${GREEN}✓ auth-frontend dependencies installed${NC}"
else
  echo -e "${GREEN}✓ auth-frontend dependencies already installed${NC}"
fi
cd ../..

# Set up particle0-frontend package
echo -e "\n${BLUE}Setting up particle0-frontend package...${NC}"
cd packages/particle0-frontend
if [ ! -d "node_modules" ]; then
  echo "Installing particle0-frontend dependencies..."
  pnpm install
  echo -e "${GREEN}✓ particle0-frontend dependencies installed${NC}"
else
  echo -e "${GREEN}✓ particle0-frontend dependencies already installed${NC}"
fi
cd ../..

# Create frontend .env.local file with Logto config if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
  echo -e "\n${BLUE}Creating frontend .env.local file...${NC}"
  cat > frontend/.env.local << EOF
# Logto Authentication Configuration
VITE_LOGTO_ENDPOINT=https://logto.dev
VITE_LOGTO_APP_ID=replace-with-your-logto-app-id
VITE_LOGTO_RESOURCES=

# API Configuration
VITE_API_URL=http://localhost:8000
EOF
  echo -e "${GREEN}✓ Frontend .env.local template created${NC}"
  echo -e "${RED}! Remember to update the Logto credentials in frontend/.env.local${NC}"
else
  echo -e "${GREEN}✓ Frontend .env.local already exists${NC}"
fi

# Set up backend
echo -e "\n${BLUE}Setting up backend...${NC}"
cd backend

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python -m venv .venv
  echo -e "${GREEN}✓ Virtual environment created${NC}"
else
  echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if authentication packages are installed
if ! pip list | grep -q "python-jose"; then
  echo "Installing authentication packages..."
  pip install python-jose[cryptography] passlib[bcrypt] python-multipart httpx
  # Update requirements.txt
  pip freeze > requirements.txt
  echo -e "${GREEN}✓ Authentication packages installed${NC}"
else
  echo -e "${GREEN}✓ Authentication packages already installed${NC}"
fi

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Set up auth-backend package
echo -e "\n${BLUE}Setting up auth-backend package...${NC}"
cd packages/auth-backend

# Create Python virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment for auth-backend..."
  python -m venv .venv
  echo -e "${GREEN}✓ Virtual environment created for auth-backend${NC}"
else
  echo -e "${GREEN}✓ Virtual environment already exists for auth-backend${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment for auth-backend..."
source .venv/bin/activate

# Install in development mode
echo "Installing auth-backend package in development mode..."
pip install -e .
echo -e "${GREEN}✓ auth-backend installed in development mode${NC}"

# Deactivate virtual environment
deactivate

cd ../..

# Set up particle0-backend package
echo -e "\n${BLUE}Setting up particle0-backend package...${NC}"
cd packages/particle0-backend

# Create Python virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment for particle0-backend..."
  python -m venv .venv
  echo -e "${GREEN}✓ Virtual environment created for particle0-backend${NC}"
else
  echo -e "${GREEN}✓ Virtual environment already exists for particle0-backend${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment for particle0-backend..."
source .venv/bin/activate

# Install dependencies
echo "Installing particle0-backend dependencies..."
pip install -e .
pip install -e ../auth-backend
echo -e "${GREEN}✓ particle0-backend dependencies installed${NC}"

# Deactivate virtual environment
deactivate

cd ../..

# Create .env file with Logto config if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# Application Settings
PROJECT_NAME=Particle0
API_V1_STR=/api/v1
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://particle0.vercel.app"]

# JWT Settings
JWT_SECRET_KEY=change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logto Settings
LOGTO_ENDPOINT=https://logto.dev
LOGTO_APP_ID=your-logto-app-id
LOGTO_APP_SECRET=your-logto-app-secret
LOGTO_REDIRECT_URI=http://localhost:3000/auth/callback
EOF
  echo -e "${GREEN}✓ .env file created${NC}"
  echo -e "${RED}! Remember to update the Logto credentials in backend/.env${NC}"
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Go back to root directory
cd ..

echo -e "\n${GREEN}=== Setup complete! ===${NC}"
echo -e "\n${BLUE}Authentication Setup Information:${NC}"
echo -e "1. Sign up for Logto at https://logto.io/"
echo -e "2. Create a new application in the Logto console"
echo -e "3. Configure redirect URIs to include http://localhost:3000/auth/callback"
echo -e "4. Copy your Logto app credentials to both frontend/.env.local and backend/.env files"
echo -e "5. In the Logto console, configure your sign-in experience as needed"
echo -e "\n${BLUE}Starting the Application:${NC}"
echo -e "  1. Original Frontend: ${BLUE}pnpm run dev:frontend${NC}"
echo -e "  2. Original Backend: ${BLUE}cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000${NC}"
echo -e "  3. Or both original: ${BLUE}pnpm run dev:all${NC} (after activating the backend venv)"
echo -e "\n${BLUE}Starting the New Packages:${NC}"
echo -e "  1. Particle0 Frontend: ${BLUE}pnpm run dev:particle0-frontend${NC}"
echo -e "  2. Particle0 Backend: ${BLUE}cd packages/particle0-backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000${NC}"
echo -e "  3. Or both packages: ${BLUE}pnpm run dev:packages${NC} (after activating the particle0-backend venv)"
echo -e "\nHappy coding! 🚀"
