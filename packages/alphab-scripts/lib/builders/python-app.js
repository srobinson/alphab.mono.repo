const CommandRunner = require("../utils/command-runner");
const chalk = require("chalk");

class PythonAppBuilder {
  constructor(detector) {
    this.detector = detector;
    this.packageDir = detector.packageDir;
    this.runner = new CommandRunner(this.packageDir);
  }

  async build() {
    console.log(chalk.green(`🐍 Building Python application: ${this.detector.getPackageName()}`));

    try {
      // Use the existing build pattern: poetry build
      await this.runner.run("poetry", ["build"]);

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
      // Use the existing dev pattern: poetry run uvicorn particle0.main:app --reload --port 8000 --host 0.0.0.0
      // We need to detect the main module - let's check if it's particle0 or something else
      const mainModule = this.detectMainModule();
      await this.runner.run("poetry", [
        "run",
        "uvicorn",
        `${mainModule}.main:app`,
        "--reload",
        "--port",
        "8000",
        "--host",
        "0.0.0.0",
      ]);
    } catch (error) {
      console.error(
        chalk.red(`❌ Dev server failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  detectMainModule() {
    // Try to detect the main module from the package name or directory structure
    const packageName = this.detector.getPackageName();
    if (packageName.includes("particle0")) {
      return "particle0";
    }
    // Default fallback - could be enhanced to read from pyproject.toml
    return "app";
  }

  async test() {
    console.log(chalk.yellow(`🧪 Testing Python application: ${this.detector.getPackageName()}`));

    try {
      // Use the existing test pattern: poetry run python -m pytest
      await this.runner.run("poetry", ["run", "python", "-m", "pytest"]);
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
        `📊 Running test coverage for Python application: ${this.detector.getPackageName()}`,
      ),
    );

    try {
      // Get the package name from the detector for coverage
      // Convert @alphab/package-name to alphab_package_name
      const packageName = this.detector
        .getPackageName()
        .replace("@alphab/", "alphab_")
        .replace("-", "_");
      await this.runner.run("poetry", [
        "run",
        "python",
        "-m",
        "pytest",
        `--cov=${packageName}`,
        "--cov-report=html",
        "--cov-report=term",
      ]);
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
    console.log(chalk.cyan(`🔍 Linting Python application: ${this.detector.getPackageName()}`));

    try {
      // Use the existing lint pattern: poetry run black .
      await this.runner.run("poetry", ["run", "black", "."]);
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
      chalk.magenta(`💅 Formatting Python application: ${this.detector.getPackageName()}`),
    );

    try {
      // Use the existing format pattern: poetry run black . && poetry run isort .
      await this.runner.run("poetry", ["run", "black", "."]);
      await this.runner.run("poetry", ["run", "isort", "."]);
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
      chalk.blue(`🔎 Type checking Python application: ${this.detector.getPackageName()}`),
    );

    try {
      // Use the existing type-check pattern: poetry run mypy .
      await this.runner.run("poetry", ["run", "mypy", "."]);
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
    console.log(chalk.gray(`🧹 Cleaning Python application: ${this.detector.getPackageName()}`));

    try {
      // Use the existing clean pattern: rm -rf node_modules dist/ build/ *.egg-info/ .pytest_cache/ .coverage htmlcov/ .venv/ poetry.lock
      await this.runner.run("rm", [
        "-rf",
        "node_modules",
        "dist/",
        "build/",
        "*.egg-info/",
        ".pytest_cache/",
        ".coverage",
        "htmlcov/",
        ".venv/",
        "poetry.lock",
      ]);
      console.log(
        chalk.green(
          `✅ Cleaning completed for ${this.detector.getPackageName()} IMPORTANT: Remember to run ``pnpm install```,
        ),
      );
    } catch (error) {
      if (error.message.includes("this.detector.getPackageName(...)")) {
        return;
      }
      console.error(
        chalk.red(`❌ Cleaning failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async bootstrap(options = {}) {
    const { withDev = false } = options;
    console.log(
      chalk.blue(`🚀 Bootstrapping Python application: ${this.detector.getPackageName()}`),
    );

    try {
      // Full bootstrap like original: venv + lock + install with dev
      console.log(chalk.gray(`🐍 Creating virtual environment...`));
      await this.runner.run("python", ["-m", "venv", ".venv"]);

      console.log(chalk.gray(`🔒 Locking dependencies...`));
      await this.runner.run("poetry", ["lock"]);

      console.log(chalk.gray(`📦 Installing dependencies with dev...`));
      await this.runner.run("poetry", ["install", "--with", "dev"]);

      console.log(chalk.green(`✅ Bootstrap completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Bootstrap failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }
}

module.exports = PythonAppBuilder;
