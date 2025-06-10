#!/usr/bin/env bash
# shellcheck disable=SC1091
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Migrating to Packages Structure ===${NC}"

# Create directories if they don't exist
mkdir -p packages/particle0-frontend/src
mkdir -p packages/particle0-frontend/public
mkdir -p packages/particle0-backend/app/api/v1/endpoints
mkdir -p packages/particle0-backend/app/models
mkdir -p packages/particle0-backend/app/schemas
mkdir -p packages/particle0-backend/app/tests
mkdir -p packages/particle0-backend/tests

# Migrate frontend
echo -e "\n${BLUE}Migrating frontend to packages/particle0-frontend...${NC}"

# Copy configuration files
echo "Copying configuration files..."
cp frontend/*.json packages/particle0-frontend/ 2> /dev/null || :
cp frontend/*.js packages/particle0-frontend/ 2> /dev/null || :
cp frontend/*.mjs packages/particle0-frontend/ 2> /dev/null || :
cp frontend/*.ts packages/particle0-frontend/ 2> /dev/null || :
cp frontend/*.md packages/particle0-frontend/ 2> /dev/null || :
cp frontend/.env* packages/particle0-frontend/ 2> /dev/null || :

# Copy source files
echo "Copying source files..."
cp -r frontend/src/* packages/particle0-frontend/src/ 2> /dev/null || :

# Copy public assets
echo "Copying public assets..."
cp -r frontend/public/* packages/particle0-frontend/public/ 2> /dev/null || :

# Update package.json to include auth-frontend dependency
echo "Updating package.json..."
if ! grep -q "auth-frontend" packages/particle0-frontend/package.json; then
  # Use temporary file for sed compatibility across platforms
  sed -i.bak 's/"dependencies": {/"dependencies": {\n    "auth-frontend": "workspace:*",/' packages/particle0-frontend/package.json
  rm packages/particle0-frontend/package.json.bak
fi

echo -e "${GREEN}✓ Frontend migration complete${NC}"

# Migrate backend
echo -e "\n${BLUE}Migrating backend to packages/particle0-backend...${NC}"

# Copy configuration files
echo "Copying configuration files..."
cp backend/*.toml packages/particle0-backend/ 2> /dev/null || :
cp backend/*.txt packages/particle0-backend/ 2> /dev/null || :
cp backend/*.json packages/particle0-backend/ 2> /dev/null || :
cp backend/*.md packages/particle0-backend/ 2> /dev/null || :
cp backend/.env* packages/particle0-backend/ 2> /dev/null || :

# Copy app files
echo "Copying app files..."
cp -r backend/app/__init__.py packages/particle0-backend/app/ 2> /dev/null || :
cp -r backend/app/core packages/particle0-backend/app/ 2> /dev/null || :

# Copy API endpoints (excluding auth.py which is now in auth-backend)
echo "Copying API endpoints..."
cp backend/app/api/__init__.py packages/particle0-backend/app/api/ 2> /dev/null || :
cp backend/app/api/v1/__init__.py packages/particle0-backend/app/api/v1/ 2> /dev/null || :
cp backend/app/api/v1/endpoints/__init__.py packages/particle0-backend/app/api/v1/endpoints/ 2> /dev/null || :
cp backend/app/api/v1/endpoints/example.py packages/particle0-backend/app/api/v1/endpoints/ 2> /dev/null || :
cp backend/app/api/v1/endpoints/health.py packages/particle0-backend/app/api/v1/endpoints/ 2> /dev/null || :

# Copy models and schemas
echo "Copying models and schemas..."
cp -r backend/app/models/* packages/particle0-backend/app/models/ 2> /dev/null || :
cp -r backend/app/schemas/* packages/particle0-backend/app/schemas/ 2> /dev/null || :

# Copy tests
echo "Copying tests..."
cp -r backend/app/tests/* packages/particle0-backend/app/tests/ 2> /dev/null || :
cp -r backend/tests/* packages/particle0-backend/tests/ 2> /dev/null || :

# Update pyproject.toml to include auth-backend dependency
echo "Updating pyproject.toml..."
if ! grep -q "logto-auth" packages/particle0-backend/pyproject.toml; then
  # Add to dependencies section
  sed -i.bak '/dependencies = \[/a \ \ \ \ "logto-auth = {path = \"..\/auth-backend\", develop = true},"' packages/particle0-backend/pyproject.toml
  rm packages/particle0-backend/pyproject.toml.bak
fi

echo -e "${GREEN}✓ Backend migration complete${NC}"

# Update imports in particle0-backend
echo -e "\n${BLUE}Updating imports in particle0-backend...${NC}"
find packages/particle0-backend -name "*.py" -type f -exec sed -i.bak 's/from app.core.auth/from logto_auth/g' {} \;
find packages/particle0-backend -name "*.py.bak" -type f -delete

# Update imports in particle0-frontend
echo -e "\n${BLUE}Updating imports in particle0-frontend...${NC}"
find packages/particle0-frontend -name "*.tsx" -type f -exec sed -i.bak 's/from "..\/contexts\/logto-provider"/from "auth-frontend"/g' {} \;
find packages/particle0-frontend -name "*.tsx.bak" -type f -delete

echo -e "\n${GREEN}=== Migration Complete! ===${NC}"
echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Review the migrated code and fix any import issues"
echo -e "2. Test the new package structure with 'pnpm run dev:packages'"
echo -e "3. Once everything is working, you can remove the old frontend and backend directories"
