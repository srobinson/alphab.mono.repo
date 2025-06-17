#!/bin/bash

# =============================================================================
# Alphab Database Setup Script
# =============================================================================
# This script documents and automates the database setup process for alphab
# projects using our custom migration system with Supabase CLI integration.
#
# Prerequisites:
# 1. Supabase project already created in admin panel
# 2. Node.js and npm installed
# 3. Supabase CLI installed (npm install -g supabase)
#
# Usage:
#   ./scripts/setup-database.sh [project-name]
#
# Example:
#   ./scripts/setup-database.sh particle0
# =============================================================================

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default project name
PROJECT_NAME=${1:-particle0}

echo -e "${BLUE}🚀 Alphab Database Setup Script${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Project: ${CYAN}${PROJECT_NAME}${NC}"
echo ""

# Step 1: Verify prerequisites
echo -e "${YELLOW}📋 Step 1: Verifying prerequisites...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}❌ Supabase CLI not found${NC}"
  echo -e "Install it with: ${CYAN}npm install -g supabase${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found: $(supabase --version)${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Not in project root directory${NC}"
  echo -e "Please run this script from the alphab.mono.repo root"
  exit 1
fi

echo -e "${GREEN}✅ In project root directory${NC}"

# Step 2: Build the migration tools
echo -e "\n${YELLOW}📋 Step 2: Building migration tools...${NC}"

echo -e "Building alphab-db-scripts..."
cd packages/alphab-db-scripts
npm run build
cd ../../

echo -e "${GREEN}✅ Migration tools built successfully${NC}"

# Step 3: Set up environment variables
echo -e "\n${YELLOW}📋 Step 3: Setting up environment variables...${NC}"

echo -e "Setting up environment in alphab-db-supabase package..."
npx alphab-migrate env:setup

echo -e "${GREEN}✅ Environment setup completed${NC}"

# Step 4: Validate environment
echo -e "\n${YELLOW}📋 Step 4: Validating environment...${NC}"

npx alphab-migrate env:validate

echo -e "${GREEN}✅ Environment validation passed${NC}"

# Step 5: Test database connection
echo -e "\n${YELLOW}📋 Step 5: Testing database connection...${NC}"

npx alphab-migrate test-connection

echo -e "${GREEN}✅ Database connection successful${NC}"

# Step 6: Initialize Supabase project (if needed)
echo -e "\n${YELLOW}📋 Step 6: Initializing Supabase project...${NC}"

if [ ! -f "supabase/config.toml" ]; then
  echo -e "Initializing Supabase project..."
  echo "N" | supabase init # Answer "No" to VS Code Deno settings
  echo -e "${GREEN}✅ Supabase project initialized${NC}"
else
  echo -e "${CYAN}ℹ️  Supabase project already initialized${NC}"
fi

# Step 7: Login to Supabase (interactive)
echo -e "\n${YELLOW}📋 Step 7: Supabase authentication...${NC}"

if ! supabase projects list &> /dev/null; then
  echo -e "Please login to Supabase..."
  supabase login
  echo -e "${GREEN}✅ Logged in to Supabase${NC}"
else
  echo -e "${CYAN}ℹ️  Already logged in to Supabase${NC}"
fi

# Step 8: Link to remote project (interactive)
echo -e "\n${YELLOW}📋 Step 8: Linking to remote Supabase project...${NC}"

if ! supabase status &> /dev/null; then
  echo -e "Please link to your remote Supabase project..."
  echo -e "${CYAN}Available projects:${NC}"
  supabase projects list
  echo ""
  supabase link
  echo -e "${GREEN}✅ Linked to remote project${NC}"
else
  echo -e "${CYAN}ℹ️  Already linked to remote project${NC}"
  supabase status
fi

# Step 9: Preview migrations (dry run)
echo -e "\n${YELLOW}📋 Step 9: Previewing migrations...${NC}"

echo -e "Running migration discovery and preview..."
npx alphab-migrate migrate --dry-run

echo -e "${GREEN}✅ Migration preview completed${NC}"

# Step 10: Execute migrations
echo -e "\n${YELLOW}📋 Step 10: Executing migrations...${NC}"

read -p "$(echo -e ${YELLOW}Do you want to execute the migrations now? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "Executing migrations..."
  npx alphab-migrate migrate
  echo -e "${GREEN}✅ Migrations executed successfully${NC}"
else
  echo -e "${CYAN}ℹ️  Skipping migration execution${NC}"
  echo -e "To execute later, run: ${CYAN}npx alphab-migrate migrate${NC}"
fi

# Step 11: Verify deployment
echo -e "\n${YELLOW}📋 Step 11: Verifying deployment...${NC}"

echo -e "Checking migration status..."
npx alphab-migrate status

echo -e "${GREEN}✅ Database setup completed successfully!${NC}"

# Summary
echo -e "\n${BLUE}📊 Setup Summary${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "Project: ${CYAN}${PROJECT_NAME}${NC}"
echo -e "Migration system: ${CYAN}alphab-db-scripts${NC}"
echo -e "Database provider: ${CYAN}Supabase${NC}"
echo -e "Migration locations:"
echo -e "  • ${CYAN}packages/alphab-db-supabase/alphab/${NC} (global schemas)"
echo -e "  • ${CYAN}packages/alphab-db-supabase/app/${PROJECT_NAME}/${NC} (app-specific)"
echo -e "  • ${CYAN}packages/alphab-db-supabase/common/${NC} (shared utilities)"
echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Review your database in the Supabase dashboard"
echo -e "2. Create new migrations with: ${CYAN}npx alphab-migrate create \"migration_name\"${NC}"
echo -e "3. Deploy future changes with: ${CYAN}npx alphab-migrate migrate${NC}"
echo ""
