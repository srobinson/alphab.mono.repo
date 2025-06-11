# Dependency Simplification Guide

_Addressing Complex Dependencies Structure_

## 🎯 Current Problem

The current dependency structure has several complexity issues:

1. **Mixed build systems**: Both PEP 621 and Poetry configurations
2. **Redundant declarations**: Dependencies declared in multiple places
3. **Inconsistent versioning**: Different Python requirements across packages
4. **Group complexity**: Dev/prod groups add unnecessary complexity

## 🛠️ Recommended Solution: Pure Poetry

### **Benefits of Pure Poetry Approach**

- ✅ Single source of truth for dependencies
- ✅ Better workspace support for monorepos
- ✅ Simplified development workflow
- ✅ Consistent across all packages

## 📁 Template Files

### **For Library Packages (alphab-\*)**

```toml
# packages/alphab-logto/pyproject.toml
[tool.poetry]
name = "alphab-logto"
version = "0.1.0"
description = "Reusable Logto authentication package for FastAPI applications"
authors = ["Alphab <info@alphab.io>"]
readme = "README.md"
license = "MIT"

[tool.poetry.dependencies]
python = ">=3.11,<3.13"
fastapi = ">=0.95.0"
httpx = ">=0.24.0"
pydantic = ">=2.0.0"
starlette = ">=0.27.0"
python-jose = {extras = ["cryptography"], version = ">=3.5.0,<4.0.0"}

[tool.poetry.group.dev.dependencies]
pytest = ">=7.3.1"
pytest-asyncio = ">=0.21.0"
pytest-cov = ">=4.1.0"
black = ">=23.3.0"
isort = ">=5.12.0"
mypy = ">=1.2.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 120
target-version = ["py311"]

[tool.isort]
profile = "black"
line_length = 120

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
addopts = "--cov=alphab_logto --cov-report=term-missing"
```

### **For Application Packages (particle0)**

```toml
# packages/particle0/pyproject.toml
[tool.poetry]
name = "particle0"
version = "0.1.0"
description = "Particle0 main application"
authors = ["Alphab Team"]
readme = "README.md"
license = "MIT"

[tool.poetry.dependencies]
python = ">=3.11,<3.13"
fastapi = ">=0.95.0"
uvicorn = ">=0.34.3,<0.35.0"
pydantic-settings = ">=2.0.0"
# Local dependencies
alphab-logto = {path = "../alphab-logto", develop = true}
alphab-logging = {path = "../alphab-logging", develop = true}

[tool.poetry.group.dev.dependencies]
pytest = ">=7.3.1"
pytest-asyncio = ">=0.21.0"
pytest-cov = ">=4.1.0"
black = ">=23.3.0"
isort = ">=5.12.0"
mypy = ">=1.2.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"

[tool.poetry.scripts]
start = "uvicorn particle0.main:app --host 0.0.0.0 --port 8000"
dev = "uvicorn particle0.main:app --reload"

[tool.black]
line-length = 120
target-version = ["py311"]

[tool.isort]
profile = "black"
line_length = 120

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
addopts = "--cov=particle0 --cov-report=term-missing"
```

## 🔄 Migration Steps

### **Step 1: Backup Current Files**

```bash
# Create backups
cp packages/alphab-logto/pyproject.toml packages/alphab-logto/pyproject.toml.backup
cp packages/particle0/pyproject.toml packages/particle0/pyproject.toml.backup
```

### **Step 2: Update Package Files**

Replace the current `pyproject.toml` files with the simplified versions above.

### **Step 3: Reinstall Dependencies**

```bash
# From project root
cd packages/alphab-logto && poetry install
cd ../particle0 && poetry install
cd ../..
```

### **Step 4: Test the Changes**

```bash
# Test builds
pnpm run build

# Test applications
pnpm run dev:particle0
```

### **Step 5: Update Scripts**

Update any scripts that reference the old dependency structure.

## ✅ Benefits After Migration

### **Simplified Workflow**

```bash
# Add dependency to library
cd packages/alphab-logto
poetry add some-package

# Add dependency to application
cd packages/particle0
poetry add some-package
```

### **Consistent Versioning**

- All packages use Python `>=3.11,<3.13`
- Consistent tool versions across packages
- Single source of truth for each dependency

### **Cleaner Configuration**

- No more mixed PEP 621 + Poetry
- No redundant dependency declarations
- Simplified dev/prod groups

## 🚨 Migration Checklist

- [ ] Backup all current `pyproject.toml` files
- [ ] Update `alphab-logto/pyproject.toml`
- [ ] Update `alphab-logging/pyproject.toml`
- [ ] Update `alphab-http-client/pyproject.toml`
- [ ] Update `particle0/pyproject.toml`
- [ ] Reinstall all dependencies
- [ ] Test all packages build successfully
- [ ] Test applications start correctly
- [ ] Update CI/CD if needed
- [ ] Update documentation

## 💡 Pro Tips

### **Dependency Management**

```bash
# Use poetry for all dependency operations
poetry add package-name              # Add to main dependencies
poetry add --group dev package-name  # Add to dev dependencies
poetry remove package-name           # Remove dependency
poetry update                        # Update all dependencies
```

### **Workspace Dependencies**

```toml
# Always use develop = true for local packages during development
alphab-logto = {path = "../alphab-logto", develop = true}

# Use without develop = true for production builds
alphab-logto = {path = "../alphab-logto"}
```

### **Version Constraints**

```toml
# Preferred: Use compatible release operator
fastapi = ">=0.95.0"

# Avoid: Exact pinning unless necessary
fastapi = "0.95.0"

# Good: Version ranges for major version compatibility
python = ">=3.11,<3.13"
```

---

_This guide simplifies the dependency structure while maintaining all functionality and improving maintainability._
