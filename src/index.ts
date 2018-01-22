import '@dojo/shim/main';

import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import registerCommands from './registerCommands';
import { join } from 'path';
import commandLoader from './allCommands';
import installableCommands, { mergeInstalledCommandsWithAvailableCommands } from './installableCommands';
const pkgDir = require('pkg-dir');

/**
 * Runs the CLI
 * - Sets up the update notifier to check for updates of the cli
 * - Loads commands
 * - Registers commands and subcommands using yargs (which runs the specified command)
 */
async function init() {
	try {
		const packagePath = pkgDir.sync(__dirname);
		const packageJsonFilePath = join(packagePath, 'package.json');
		const packageJson = <any> require(packageJsonFilePath);

		updateNotifier(packageJson);

		const availableCommands = await installableCommands(packageJson.name);
		const allCommands = await commandLoader();
		const mergedCommands = mergeInstalledCommandsWithAvailableCommands(allCommands, availableCommands);

		registerCommands(yargs, mergedCommands.commandsMap, mergedCommands.yargsCommandNames);
	} catch (err) {
		console.log(`Commands are not available: ${err}`);
	}
}

process.env.DOJO_CLI = 'true';
init();
