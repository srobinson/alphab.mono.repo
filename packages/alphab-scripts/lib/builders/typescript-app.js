const CommandRunner = require("../utils/command-runner");
const chalk = require("chalk");

class TypeScriptAppBuilder {
  constructor(detector) {
    this.detector = detector;
    this.packageDir = detector.packageDir;
    this.runner = new CommandRunner(this.packageDir);
  }

  async build() {
    console.log(
      chalk.green(`🚀 Building TypeScript application: ${this.detector.getPackageName()}`),
    );

    try {
      // First compile TypeScript using tsconfig.app.json
      await this.runner.run("tsc", ["--project", "tsconfig.app.json"]);

      // Then build with Vite
      await this.runner.run("vite", ["build"]);

      console.log(chalk.green(`✅ Successfully built ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Build failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async dev() {
    console.log(chalk.blue(`🔥 Starting dev server for: ${this.detector.getPackageName()}`));

    try {
      // Use the existing dev command pattern: vite --port 3000 --host 0.0.0.0
      await this.runner.run("vite", ["--port", "3000", "--host", "0.0.0.0"]);
    } catch (error) {
      console.error(
        chalk.red(`❌ Dev server failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async test() {
    console.log(
      chalk.yellow(`🧪 Testing TypeScript application: ${this.detector.getPackageName()}`),
    );

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
        `📊 Running test coverage for TypeScript application: ${this.detector.getPackageName()}`,
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
    console.log(chalk.cyan(`🔍 Linting TypeScript application: ${this.detector.getPackageName()}`));

    try {
      // Use the existing lint pattern: eslint . --max-warnings 20
      await this.runner.run("eslint", ["src", "--max-warnings", "20"]);
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
      chalk.magenta(`💅 Formatting TypeScript application: ${this.detector.getPackageName()}`),
    );

    try {
      // Use the existing format pattern: eslint . --fix && prettier --write .
      await this.runner.run("eslint", [".", "--fix"]);
      await this.runner.run("prettier", ["--write", "."]);
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
      chalk.blue(`🔎 Type checking TypeScript application: ${this.detector.getPackageName()}`),
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
    console.log(
      chalk.gray(`🧹 Cleaning TypeScript application: ${this.detector.getPackageName()}`),
    );

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
      chalk.blue(`🚀 Bootstrapping TypeScript application: ${this.detector.getPackageName()}`),
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

module.exports = TypeScriptAppBuilder;
