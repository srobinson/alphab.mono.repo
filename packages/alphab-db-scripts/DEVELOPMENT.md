# Development Cheat Sheet

## 🔨 After Every Code Change

```bash
cd packages/alphab-db-scripts
npm run build
```

**Why?** TypeScript needs to compile `src/` → `dist/` for the CLI to work.

## 🧪 Quick Test

```bash
npx alphab-migrate help
npx alphab-migrate test-connection --provider supabase
```

## 📁 File Structure

```
src/cli/index.ts     → dist/cli/index.js     (main entry)
src/core/config.ts   → dist/core/config.js   (provider configs)
src/cli/supabase.ts  → dist/cli/supabase.js  (supabase commands)
```

## 🚨 Common Errors

### "Cannot find module"

```bash
# Solution:
npm run build
```

### "Provider not found"

```bash
# Use valid provider:
--provider supabase
--provider postgres
--provider mongodb
```

### TypeScript errors

```bash
# Check types:
npm run type-check
```

## 🔄 Development Flow

1. Edit `src/` files
2. `npm run build`
3. Test with `npx alphab-migrate`
4. Repeat

---

**Remember**: The CLI runs from `dist/`, not `src/`! 🎯
