#!/usr/bin/env node

import { writeFile, existsSync } from "fs-extra";
import { join } from "path";
import chalk from "chalk";
import { createInterface } from "readline";

const ENV_TEMPLATE = `# =============================================================================
# ALPHAB MONOREPO ENVIRONMENT VARIABLES
# =============================================================================
# This file contains your actual environment variables
# DO NOT commit this file to version control

# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
# Get these from your Supabase project settings
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# Project name for database operations
PROJECT_NAME=particle0

# Database connection settings
DB_POOL_SIZE=10
DB_TIMEOUT=30000

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
# Environment (development, staging, production)
NODE_ENV=development

# API Configuration
API_V1_STR=/api/v1

# CORS Settings
BACKEND_CORS_ORIGINS=http://localhost:3000,https://particle0.vercel.app

# =============================================================================
# AUTHENTICATION (LOGTO)
# =============================================================================
# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logto Settings
LOGTO_ENDPOINT=https://your-tenant.logto.app/
LOGTO_APP_ID=your-app-id
LOGTO_APP_SECRET=your-app-secret
LOGTO_REDIRECT_URI=http://localhost:8000/api/v1/auth/callback

# Machine-to-Machine Application for Management API
LOGTO_M2M_APP_ID=your-m2m-app-id
LOGTO_M2M_APP_SECRET=your-m2m-app-secret

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================
# Enable verbose logging for development
VERBOSE=false

# Enable debug mode
DEBUG=false
`;

function promptUser(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function setupEnvironment() {
  console.log(chalk.blue("🔧 Alphab Environment Setup"));
  console.log(chalk.gray("This will help you set up environment variables for the monorepo.\n"));

  // Check if .env.local already exists
  const envLocalPath = join(process.cwd(), ".env.local");

  if (existsSync(envLocalPath)) {
    console.log(chalk.yellow("⚠️  .env.local already exists!"));
    const overwrite = await promptUser("Do you want to overwrite it? (y/N): ");

    if (overwrite.toLowerCase() !== "y" && overwrite.toLowerCase() !== "yes") {
      console.log(chalk.gray("Setup cancelled."));
      return;
    }
  }

  console.log(chalk.green("📝 Creating .env.local template..."));

  try {
    await writeFile(envLocalPath, ENV_TEMPLATE);

    console.log(chalk.green("✅ Environment template created successfully!"));
    console.log(chalk.blue("\n📋 Next steps:"));
    console.log(chalk.gray("1. Edit .env.local with your actual values"));
    console.log(chalk.gray("2. Get Supabase credentials from your project dashboard"));
    console.log(chalk.gray("3. Run: npm run db:test-connection to verify setup"));
    console.log(chalk.gray("4. Never commit .env.local to version control\n"));

    console.log(chalk.yellow("🔑 Required variables for database operations:"));
    console.log(chalk.gray("   - SUPABASE_URL"));
    console.log(chalk.gray("   - SUPABASE_SERVICE_ROLE_KEY"));
  } catch (error) {
    console.error(chalk.red("❌ Failed to create .env.local:"), error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupEnvironment().catch((error) => {
    console.error(chalk.red("Setup failed:"), error);
    process.exit(1);
  });
}

export { setupEnvironment };
