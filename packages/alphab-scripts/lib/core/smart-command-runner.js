// packages/alphab-scripts/lib/core/smart-command-runner.js
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const PackageDetector = require("../utils/package-detector");

// Import all builders
const TypeScriptLibraryBuilder = require("../builders/typescript-library");
const TypeScriptAppBuilder = require("../builders/typescript-app");
const PythonLibraryBuilder = require("../builders/python-library");
const PythonAppBuilder = require("../builders/python-app");
const ConfigPackageBuilder = require("../builders/config-package");

class SmartCommandRunner {
  constructor() {
    this.detector = null;
    this.builder = null;
    this.repoState = this.analyzeRepoState();
  }

  analyzeRepoState() {
    const state = {
      isHealthy: true,
      issues: [],
      suggestions: [],
    };

    // Find the root directory by looking for pnpm-workspace.yaml
    let rootDir = process.cwd();
    while (rootDir !== path.dirname(rootDir)) {
      if (fs.existsSync(path.join(rootDir, "pnpm-workspace.yaml"))) {
        break;
      }
      rootDir = path.dirname(rootDir);
    }

    const rootLockFile = path.join(rootDir, "pnpm-lock.yaml");
    const rootNodeModules = path.join(rootDir, "node_modules");
    const currentNodeModules = path.join(process.cwd(), "node_modules");
    const isInPackage = process.cwd().includes("/packages/") || process.cwd().includes("/apps/");

    if (!fs.existsSync(rootLockFile)) {
      state.isHealthy = false;
      state.issues.push("❌ Root pnpm-lock.yaml is missing");
      state.suggestions.push("💡 Run 'pnpm install' from the root directory");
    } else if (!fs.existsSync(rootNodeModules)) {
      state.isHealthy = false;
      state.issues.push("❌ Root node_modules is missing");
      state.suggestions.push("💡 Run 'pnpm install' from the root directory");
    } else if (isInPackage && !fs.existsSync(currentNodeModules)) {
      state.issues.push("⚠️  Package node_modules is missing");
      state.suggestions.push("💡 Run 'pnpm install' from the root directory");
    }

    return state;
  }

  displayRepoState() {
    if (!this.repoState.isHealthy) {
      console.log(chalk.yellow("\n🔍 Repository State Issues Detected:"));
      this.repoState.issues.forEach((issue) => console.log(`  ${issue}`));
      console.log(chalk.cyan("\n💡 Suggestions:"));
      this.repoState.suggestions.forEach((suggestion) => console.log(`  ${suggestion}`));
      console.log(); // Empty line for spacing
    }
  }

  async initializeDetectorAndBuilder() {
    try {
      this.detector = new PackageDetector();
      const packageType = this.detector.getPackageType();

      // Create builder based on package type
      switch (packageType) {
        case "root-package":
          this.builder = new ConfigPackageBuilder(this.detector);
          break;
        case "typescript-library":
          this.builder = new TypeScriptLibraryBuilder(this.detector);
          break;
        case "typescript-app":
          this.builder = new TypeScriptAppBuilder(this.detector);
          break;
        case "python-library":
          this.builder = new PythonLibraryBuilder(this.detector);
          break;
        case "python-app":
          this.builder = new PythonAppBuilder(this.detector);
          break;
        case "config-package":
          this.builder = new ConfigPackageBuilder(this.detector);
          break;
        default:
          throw new Error(`Unknown package type: ${packageType}`);
      }

      return { packageType, packageName: this.getPackageName() };
    } catch (error) {
      // Handle the getPackageName error gracefully
      if (error.message.includes("getPackageName")) {
        console.log(
          chalk.yellow("⚠️  Could not determine package name (this is normal for some operations)"),
        );
        return { packageType: "unknown", packageName: "unknown" };
      }
      throw error;
    }
  }

  getPackageName() {
    try {
      return this.detector.getPackageName();
    } catch (error) {
      return "unknown-package";
    }
  }

  async runCommand(commandName, options = {}) {
    console.log(chalk.blue(`\n🚀 Running ${commandName}...`));

    // Always display repo state first
    this.displayRepoState();

    try {
      const { packageType, packageName } = await this.initializeDetectorAndBuilder();

      console.log(chalk.yellow(`📦 Package: ${packageName} (${packageType})`));

      // Handle special cases for root package
      if (packageType === "root-package" && ["bootstrap", "clean"].includes(commandName)) {
        return this.handleRootPackageCommand(commandName, options);
      }

      // Check if builder supports the command
      if (!this.builder || typeof this.builder[commandName] !== "function") {
        console.log(
          chalk.yellow(
            `⚠️  Command '${commandName}' not supported for package type: ${packageType}`,
          ),
        );
        return;
      }

      // Execute the command
      await this.builder[commandName](options);
      console.log(chalk.green(`✅ ${commandName} completed successfully for ${packageName}`));
    } catch (error) {
      console.error(chalk.red(`💥 ${commandName} failed: ${error.message}`));

      // Provide helpful context
      if (error.message.includes("node_modules")) {
        console.log(chalk.yellow("💡 Try running 'pnpm install' from the root directory"));
      }

      throw error;
    }
  }

  async handleRootPackageCommand(commandName, options) {
    const CommandRunner = require("../utils/command-runner");
    const runner = new CommandRunner(process.cwd());

    switch (commandName) {
      case "bootstrap":
        console.log(chalk.blue("🔥 Bootstrapping root package"));
        if (!this.repoState.isHealthy) {
          console.log(chalk.yellow("⚠️  Repository state issues detected. Running 'pnpm install'"));
          try {
            await runner.run("pnpm", ["install"]);
            console.log(chalk.green("✅ Dependencies installed successfully"));
          } catch (error) {
            console.error(chalk.red(`❌ Failed to install dependencies: ${error.message}`));
            throw error;
          }
        } else {
          console.log(chalk.green("✅ Repository state is healthy"));
        }
        break;

      case "clean":
        console.log(chalk.blue("🧹 Cleaning root package"));

        if (options.deep) {
          console.log(chalk.yellow("🗑️  Deep clean: removing pnpm-lock.yaml and node_modules"));
          try {
            await runner.run("rm", ["-rf", "node_modules", "pnpm-lock.yaml"]);
            console.log(chalk.green("✅ Deep clean completed"));
            console.log(chalk.cyan("💡 Run 'pnpm install' to restore dependencies"));
          } catch (error) {
            console.error(chalk.red(`❌ Deep clean failed: ${error.message}`));
          }
        } else {
          // Regular clean - just clean build artifacts
          try {
            await runner.run("rm", ["-rf", "dist", "build", ".turbo"]);
            console.log(chalk.green("✅ Build artifacts cleaned"));
          } catch (error) {
            console.error(chalk.red(`❌ Clean failed: ${error.message}`));
          }
        }
        break;
    }
  }
}

module.exports = SmartCommandRunner;
