import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import loadCommands from './loadCommands';
import registerCommands from './registerCommands';
import { initCommandLoader } from './command';
import { join } from 'path';
import dirname from './dirname';
const pkgDir = require('pkg-dir');

const packagePath = pkgDir.sync(dirname);
const packageJsonFilePath = join(packagePath, 'package.json');
const pkg = <any> require(packageJsonFilePath);

/**
 * Runs the CLI
 * - Sets up the update notifier to check for updates
 * - Creates a command loader
 * - Loads commands found within config.searchPaths
 * - Registers commands and subcommands using yargs
 */
async function init() {
	updateNotifier(pkg, 0);
	yargs.version(pkg.version);
	const loader = initCommandLoader(config.searchPrefix);
	const { commandsMap, yargsCommandNames } = await loadCommands(yargs, config, loader);
	registerCommands(yargs, commandsMap, yargsCommandNames);
}

init();
