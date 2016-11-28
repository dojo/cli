import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import registerCommands from './registerCommands';
import { join } from 'path';
import { allCommands } from './AllCommands';
const pkgDir = require('pkg-dir');

const packagePath = pkgDir.sync(__dirname);
const packageJsonFilePath = join(packagePath, 'package.json');
const pkg = <any> require(packageJsonFilePath);

/**
 * Runs the CLI
 * - Sets up the update notifier to check for updates of the cli
 * - Loads commands
 * - Registers commands and subcommands using yargs (which runs the specified command)
 */
async function init() {
	try {
		updateNotifier(pkg, 0);
		await allCommands.init();
		registerCommands(yargs, allCommands.commands, allCommands.yargsCommandNames);
	} catch (err) {
		console.log(`Commands are not available: ${err}`);
	}
}
init();
