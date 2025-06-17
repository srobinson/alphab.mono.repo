const fs = require("fs");
const path = require("path");

class PackageDetector {
  constructor(packageDir = process.cwd()) {
    this.packageDir = packageDir;
    this.packageJson = this.loadPackageJson();
  }

  loadPackageJson() {
    const packageJsonPath = path.join(this.packageDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`No package.json found in ${this.packageDir}`);
    }
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  }

  getPackageType() {
    // first check this is not the root package.json
    // if (this.packageDir === process.cwd()) {
    //   return "root-package";
    // }

    // First check explicit packageType
    if (this.packageJson.packageType) {
      return this.packageJson.packageType;
    }

    // Auto-detect based on files and dependencies
    return this.autoDetectType();
  }

  autoDetectType() {
    const hasViteConfig =
      fs.existsSync(path.join(this.packageDir, "vite.config.ts")) ||
      fs.existsSync(path.join(this.packageDir, "vite.config.js"));
    const hasPyProjectToml = fs.existsSync(path.join(this.packageDir, "pyproject.toml"));
    const hasAppTsConfig = fs.existsSync(path.join(this.packageDir, "tsconfig.app.json"));
    const hasPoetryLock = fs.existsSync(path.join(this.packageDir, "poetry.lock"));
    const isInAppsDir = this.packageDir.includes("/apps/");
    const isInPackagesDir = this.packageDir.includes("/packages/");

    // Python detection
    if (hasPyProjectToml || hasPoetryLock) {
      if (isInAppsDir) {
        return "python-app";
      }
      return "python-library";
    }

    // TypeScript app detection (has vite config or is in apps dir with tsconfig.app.json)
    if (hasViteConfig || (isInAppsDir && hasAppTsConfig)) {
      return "typescript-app";
    }

    // TypeScript library detection
    if (
      fs.existsSync(path.join(this.packageDir, "tsconfig.json")) ||
      fs.existsSync(path.join(this.packageDir, "tsconfig.app.json"))
    ) {
      return "typescript-library";
    }

    // Config package detection
    if (this.packageJson.name && this.packageJson.name.startsWith("@alphab/config-")) {
      return "config-package";
    }

    throw new Error(
      `Cannot determine package type for ${this.packageDir}. Please add "packageType" to package.json`,
    );
  }

  getPackageName() {
    return this.packageJson.name;
  }

  isRootPackage() {
    return this.packageDir === process.cwd();
  }

  isApp() {
    return this.packageDir.includes("/apps/") || this.getPackageType().includes("app");
  }

  isLibrary() {
    return this.packageDir.includes("/packages/") || this.getPackageType().includes("library");
  }

  isPython() {
    return this.getPackageType().includes("python");
  }

  isTypeScript() {
    return this.getPackageType().includes("typescript");
  }

  isConfig() {
    return this.getPackageType() === "config-package";
  }

  hasScript(scriptName) {
    return this.packageJson.scripts && this.packageJson.scripts[scriptName];
  }

  getScript(scriptName) {
    return this.packageJson.scripts && this.packageJson.scripts[scriptName];
  }
}

module.exports = PackageDetector;
