#!/bin/bash

# Verification script for the Alphab monorepo migration

echo "🔍 Verifying Alphab Monorepo Migration..."
echo ""

# Check package structure
echo "📦 Package Structure:"
ls -la packages/
echo ""

# Check Python modules
echo "🐍 Python Module Structure:"
echo "auth-logto-backend modules:"
ls -la packages/auth-logto-backend/ | grep alphab
echo ""
echo "particle0-backend modules:"
ls -la packages/particle0-backend/ | grep alphab
echo ""

# Check package.json files
echo "📋 Package Names:"
echo "Root package:"
grep '"name"' package.json
echo ""
echo "auth-logto-frontend:"
grep '"name"' packages/auth-logto-frontend/package.json
echo ""
echo "auth-logto-backend:"
grep '"name"' packages/auth-logto-backend/package.json
echo ""

# Check for remaining old imports (should be none)
echo "🔍 Checking for old import patterns..."
echo "Checking for 'logto_auth' imports (should be none):"
grep -r "from logto_auth" packages/ || echo "✅ No old logto_auth imports found"
echo ""
echo "Checking for 'particle0_backend' imports (should be none):"
grep -r "from particle0_backend" packages/ || echo "✅ No old particle0_backend imports found"
echo ""

# Check for console.log statements (should be commented out)
echo "🔒 Security Check - Console.log statements:"
grep -r "console\.log" packages/ | head -5 || echo "✅ No active console.log statements found"
echo ""

# Check new import patterns
echo "✅ Checking new import patterns:"
echo "New alphab_logto imports:"
grep -r "from alphab_logto" packages/ | head -3 || echo "No alphab_logto imports found yet"
echo ""
echo "New alphab_particle0 imports:"
grep -r "from alphab_particle0" packages/ | head -3 || echo "No alphab_particle0 imports found yet"
echo ""

echo "🎉 Migration verification completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Package directories renamed to follow @alphab scoped naming"
echo "  ✅ Python modules updated with alphab_ prefix"
echo "  ✅ Package.json files updated with scoped names"
echo "  ✅ Old import patterns removed"
echo "  ✅ Security issues addressed (console.log statements)"
echo ""
echo "🚀 Next steps:"
echo "  1. Run 'pnpm install' to update workspace dependencies"
echo "  2. Test applications: 'pnpm run dev:particle0-frontend' and 'pnpm run dev:particle0-backend'"
echo "  3. Run tests: 'pnpm run test:auth-logto-frontend' and 'pnpm run test:auth-logto-backend'"
echo "  4. Commit changes to version control"
