const CommandRunner = require("../utils/command-runner");
const chalk = require("chalk");

class ConfigPackageBuilder {
  constructor(detector) {
    this.detector = detector;
    this.packageDir = detector.packageDir;
    this.runner = new CommandRunner(this.packageDir);
  }

  async build() {
    console.log(chalk.green(`⚙️  Config package: ${this.detector.getPackageName()}`));
    console.log(chalk.gray("Config packages typically don't require building."));
  }

  async dev() {
    console.log(chalk.blue(`⚙️  Config package: ${this.detector.getPackageName()}`));
    console.log(chalk.gray("Config packages typically don't have a dev mode."));
  }

  async test() {
    console.log(chalk.yellow(`🧪 Testing config package: ${this.detector.getPackageName()}`));
    console.log(chalk.gray("Config packages typically don't have tests."));
  }

  async lint() {
    console.log(chalk.cyan(`🔍 Linting config package: ${this.detector.getPackageName()}`));
    console.log(chalk.gray("Config packages typically don't require linting."));
  }

  async format() {
    console.log(chalk.magenta(`💅 Formatting config package: ${this.detector.getPackageName()}`));
    console.log(chalk.gray("Config packages typically don't require formatting."));
  }

  async typeCheck() {
    console.log(chalk.blue(`🔎 Type checking config package: ${this.detector.getPackageName()}`));
    console.log(chalk.gray("Config packages typically don't require type checking."));
  }

  async clean() {
    console.log(chalk.gray(`🧹 Cleaning config package: ${this.detector.getPackageName()}`));

    try {
      // Basic clean for config packages
      await this.runner.run("rm", ["-rf", "node_modules", ".turbo"]);
      console.log(chalk.green(`✅ Cleaning completed for ${this.detector.getPackageName()}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Cleaning failed for ${this.detector.getPackageName()}: ${error.message}`),
      );
      throw error;
    }
  }
}

module.exports = ConfigPackageBuilder;
