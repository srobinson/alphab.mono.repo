// packages/alphab-scripts/lib/builders/python-library.js
const CommandRunner = require("../utils/command-runner");
const chalk = require("chalk");

class PythonLibraryBuilder {
  constructor(detector) {
    this.detector = detector;
    this.packageDir = detector.packageDir;
    this.runner = new CommandRunner(this.packageDir);
  }

  async build() {
    console.log(chalk.green(`[🐍] Building Python library: ${this.detector.getPackageName()}`));

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
    console.log(chalk.blue(`👀 No dev mode for Python library: ${this.detector.getPackageName()}`));
    console.log(
      chalk.gray("Python libraries typically don't have a dev server. Use test or build instead."),
    );
  }

  async test() {
    console.log(chalk.yellow(`🧪 Testing Python library: ${this.detector.getPackageName()}`));

    try {
      // Use poetry to run tests in the virtual environment
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
        `📊 Running test coverage for Python library: ${this.detector.getPackageName()}`,
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
    console.log(chalk.cyan(`🔍 Linting Python library: ${this.detector.getPackageName()}`));

    try {
      // Check if the package uses ruff or black for linting
      const hasRuff =
        this.detector.hasScript("lint") && this.detector.getScript("lint").includes("ruff");

      if (hasRuff) {
        // Use ruff check pattern: ruff check .
        await this.runner.run("ruff", ["check", "."]);
      } else {
        // Use black pattern: black .
        await this.runner.run("black", ["."]);
      }

      console.log(chalk.green(`✅ Linting passed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Linting failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async format() {
    console.log(chalk.magenta(`💅 Formatting Python library: ${this.detector.getPackageName()}`));

    try {
      // Check if the package uses ruff or black for formatting
      const hasRuff =
        this.detector.hasScript("lint:fix") && this.detector.getScript("lint:fix").includes("ruff");

      if (hasRuff) {
        // Use ruff fix pattern: ruff check . --fix
        await this.runner.run("ruff", ["check", ".", "--fix"]);
      } else {
        // Use black pattern: black .
        await this.runner.run("black", ["."]);
      }

      console.log(chalk.green(`✅ Formatting completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Formatting failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }

  async typeCheck() {
    console.log(chalk.blue(`🔎 Type checking Python library: ${this.detector.getPackageName()}`));

    try {
      // Use mypy for type checking
      await this.runner.run("python", ["-m", "mypy", "."]);
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

      console.error(chalk.red(`❌ !!! Cleaning failed for: ${error.message}`));
      throw error;
    }
  }

  async bootstrap(options = {}) {
    const { withDev = false } = options;
    console.log(chalk.blue(`🚀 Bootstrapping Python library: ${this.detector.getPackageName()}`));

    try {
      // Full bootstrap like original: venv + lock + install with dev + build
      console.log(chalk.gray(`🐍 Creating virtual environment...`));
      await this.runner.run("python", ["-m", "venv", ".venv"]);

      console.log(chalk.gray(`🔒 Locking dependencies...`));
      await this.runner.run("poetry", ["lock"]);

      if (withDev) {
        console.log(chalk.gray(`📦 Installing dependencies with dev...`));
        await this.runner.run("poetry", ["install", "--with", "dev"]);
      } else {
        console.log(chalk.gray(`📦 Installing dependencies...`));
        await this.runner.run("poetry", ["install"]);
      }

      console.log(chalk.green(`✅ Bootstrap completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Bootstrap failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }
}

module.exports = PythonLibraryBuilder;
