// packages/alphab-scripts/lib/core/universal-command.js
const SmartCommandRunner = require("./smart-command-runner");

/**
 * Universal command runner that eliminates duplication across all bin scripts
 * Usage: createUniversalCommand("build", { options })
 */
function createUniversalCommand(commandName, defaultOptions = {}) {
  return async function () {
    const runner = new SmartCommandRunner();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = { ...defaultOptions };

    // Parse common flags
    if (args.includes("--with-dev")) {
      options.withDev = true;
    }

    if (args.includes("--deep")) {
      options.deep = true;
    }

    if (args.includes("--verbose")) {
      options.verbose = true;
    }

    try {
      await runner.runCommand(commandName, options);
      process.exit(0);
    } catch (error) {
      console.error(`Command '${commandName}' failed:`, error.message);
      process.exit(1);
    }
  };
}

module.exports = { createUniversalCommand };
