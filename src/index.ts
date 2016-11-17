import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import {loadCommands } from './loadCommands';
import registerCommands from './registerCommands';
import { initCommandLoader, createBuiltInCommandLoader } from './command';
import { join } from 'path';
import { enumerateInstalledCommands, enumerateBuiltInCommands} from './loadCommands';
const pkgDir = require('pkg-dir');

const packagePath = pkgDir.sync(__dirname);
const packageJsonFilePath = join(packagePath, 'package.json');
const pkg = <any> require(packageJsonFilePath);

/**
 * Runs the CLI
 * - Sets up the update notifier to check for updates of the cli
 * - Creates command loaders (inbuilt commands, and installed commands)
 * - Loads commands
 * - Registers commands and subcommands using yargs
 * - Runs the specified command
 */
async function init() {
	try {
		updateNotifier(pkg, 0);

		console.log('before');
		const builtInCommandLoader = createBuiltInCommandLoader();
		console.log('after');
		const installedCommandLoader = initCommandLoader(config.searchPrefix);

		// look for commands in a 'commands` subdir of our current location
		const builtInCommandsPaths = await enumerateBuiltInCommands(config);
		const installedCommandsPaths = await enumerateInstalledCommands(config);

		const builtInCommands = await loadCommands(builtInCommandsPaths, builtInCommandLoader);
		const installedCommands = await loadCommands(installedCommandsPaths, installedCommandLoader);

		// combine the inbuilt and installed commands - last in wins when keys clash
		const commands = new Map([...installedCommands.commandsMap, ...builtInCommands.commandsMap]);
		const yargsCommandNames = new Map([...installedCommands.yargsCommandNames, ...builtInCommands.yargsCommandNames]);

		// register all the command with yargs and allow it to do the commands processing
		registerCommands(yargs, commands, yargsCommandNames);
	} catch (err) {
		console.log(`Some commands are not available: ${err}`);
	}
}
init();
