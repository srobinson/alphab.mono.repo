// packages/alphab-scripts/lib/builders/typescript-library.js
const CommandRunner = require("../utils/command-runner");
const chalk = require("chalk");

class TypeScriptLibraryBuilder {
  constructor(detector) {
    console.log(chalk.blue(`🚀 Bootstrapping TypeScript library: ${detector.getPackageName()}`));
    this.detector = detector;
    this.packageDir = detector.packageDir;
    this.runner = new CommandRunner(this.packageDir);
  }

  async build() {
    console.log(chalk.green(`📦 Building TypeScript library: ${this.detector.getPackageName()}`));

    try {
      // Use tsconfig.json for libraries
      await this.runner.run("tsc", ["--project", "tsconfig.json"]);

      console.log(chalk.green(`✅ Successfully built ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Build failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async dev() {
    console.log(chalk.blue(`👀 Starting watch mode for: ${this.detector.getPackageName()}`));

    try {
      // Use the existing dev pattern: tsc --project tsconfig.app.json --watch
      await this.runner.run("tsc", ["--project", "tsconfig.app.json", "--watch"]);
    } catch (error) {
      console.error(
        chalk.red(`❌ Watch mode failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async test() {
    console.log(chalk.yellow(`🧪 Testing TypeScript library: ${this.detector.getPackageName()}`));

    try {
      await this.runner.run("vitest", ["run"]);
      console.log(chalk.green(`✅ Tests passed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Tests failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async testCoverage() {
    console.log(
      chalk.yellow(
        `📊 Running test coverage for TypeScript library: ${this.detector.getPackageName()}`,
      ),
    );

    try {
      await this.runner.run("vitest", ["run", "--coverage"]);
      console.log(chalk.green(`✅ Test coverage completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Test coverage failed for ${this.detector.getPackageName()}: ${error.message}`,
        ),
      );
      throw error;
    }
  }

  async lint() {
    console.log(chalk.cyan(`🔍 Linting TypeScript library: ${this.detector.getPackageName()}`));

    try {
      // Use the existing lint pattern: eslint src
      await this.runner.run("eslint", ["src"]);
      console.log(chalk.green(`✅ Linting passed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Linting failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async format() {
    console.log(
      chalk.magenta(`💅 Formatting TypeScript library: ${this.detector.getPackageName()}`),
    );

    try {
      // Use the existing lint:fix pattern: eslint src --fix
      await this.runner.run("eslint", ["src", "--fix"]);
      console.log(chalk.green(`✅ Formatting completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Formatting failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async typeCheck() {
    console.log(
      chalk.blue(`🔎 Type checking TypeScript library: ${this.detector.getPackageName()}`),
    );

    try {
      await this.runner.run("tsc", ["--noEmit"]);
      console.log(chalk.green(`✅ Type checking passed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Type checking failed for ${this.detector.getPackageName()}: ${error.message}`,
        ),
      );
      throw error;
    }
  }

  async clean() {
    console.log(chalk.gray(`🧹 Cleaning TypeScript library: ${this.detector.getPackageName()}`));

    try {
      // Use the existing clean pattern: rm -rf dist node_modules .turbo
      await this.runner.run("rm", ["-rf", "dist", "node_modules", ".turbo"]);
      console.log(chalk.green(`✅ Cleaning completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Cleaning failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async bootstrap(options = {}) {
    console.log(
      chalk.blue(`🚀 Bootstrapping TypeScript library: ${this.detector.getPackageName()}`),
    );

    try {
      // Install dependencies and build
      await this.runner.run("pnpm", ["install"]);
      await this.build();
      console.log(chalk.green(`✅ Bootstrap completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Bootstrap failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }
}

module.exports = TypeScriptLibraryBuilder;
