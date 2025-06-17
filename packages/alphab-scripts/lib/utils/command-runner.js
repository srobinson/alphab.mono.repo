const { spawn } = require("cross-spawn");
const chalk = require("chalk");

class CommandRunner {
  constructor(packageDir = process.cwd()) {
    this.packageDir = packageDir;
  }

  async run(command, args = [], options = {}) {
    const fullCommand = `${command} ${args.join(" ")}`.trim();

    console.log(chalk.blue(`🔧 Running: ${fullCommand}`));
    console.log(chalk.yellow(`📁 In: ${this.packageDir}`));

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: this.packageDir,
        stdio: "inherit",
        shell: true,
        ...options,
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${fullCommand}`));
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Failed to start command: ${error.message}`));
      });
    });
  }

  async runMultiple(commands) {
    for (const { command, args, options } of commands) {
      await this.run(command, args, options);
    }
  }

  // Helper method for common patterns
  async runScript(script) {
    if (script.includes("&&")) {
      // Handle chained commands
      const parts = script.split("&&").map((s) => s.trim());
      for (const part of parts) {
        const [cmd, ...args] = part.split(" ");
        await this.run(cmd, args);
      }
    } else {
      const [cmd, ...args] = script.split(" ");
      await this.run(cmd, args);
    }
  }
}

module.exports = CommandRunner;
