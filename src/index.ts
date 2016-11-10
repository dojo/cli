import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import { loadCommands } from './loadCommands';
import registerCommands from './registerCommands';
import { initCommandLoader, createBuiltInCommandLoader } from './command';
import { join } from 'path';
import dirname from './dirname';
import { enumerateInstalledCommands, enumerateBuiltInCommands} from "./loadCommands";
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
	//create loader funcs
	const installedCommandLoader = initCommandLoader(config.searchPrefix);
	const builtInCommandLoader = createBuiltInCommandLoader();

	const installedCommandsPaths = await enumerateInstalledCommands(config);
	const installedCommands = await loadCommands(installedCommandsPaths, installedCommandLoader);
	const builtInCommandsPaths = await enumerateBuiltInCommands();
	const builtInCommands = await loadCommands(builtInCommandsPaths, builtInCommandLoader);

	console.log('asdad');
	//combine the inbuilt and installed commands - last in wins when keys clash
	const commandsMap = new Map([...installedCommands.commandsMap, ...builtInCommands.commandsMap]);
	const yargsCommandNames = new Set([...installedCommands.yargsCommandNames, ...builtInCommands.yargsCommandNames]);
	registerCommands(yargs, commandsMap, yargsCommandNames);
}

init();
