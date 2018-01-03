import '@dojo/shim/main';

import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import registerCommands from './registerCommands';
import { join } from 'path';
import commandLoader from './allCommands';
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
		const pkg = <any> require(packageJsonFilePath);

		updateNotifier(pkg, 0);
		const allCommands = await commandLoader();
		registerCommands(yargs, allCommands.commandsMap, allCommands.yargsCommandNames);
	} catch (err) {
		console.log(`Commands are not available: ${err}`);
	}
}

process.env.DOJO_CLI = 'true';
init();
