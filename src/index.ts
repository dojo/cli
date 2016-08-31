import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import loadCommands from './loadCommands';
import registerCommands from './registerCommands';
import { initCommandLoader } from './command';
const pkg = <any> require('../../package.json');

/**
 * Runs the CLI
 * - Sets up the update notifier to check for updates
 * - Creates a command loader
 * - Loads commands found within config.searchPaths
 * - Registers commands and subcommands using yargs
 */
async function init() {
	updateNotifier(pkg, 0);
	const loader = initCommandLoader(config.searchPrefix);
	const { commandsMap, yargsCommandNames } = await loadCommands(yargs, config, loader);
	registerCommands(yargs, commandsMap, yargsCommandNames);
}

init();
