import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import {loadCommands, LoadedCommands, YargsCommandNames} from './loadCommands';
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
	const builtInCommandLoader = createBuiltInCommandLoader();
	const installedCommandLoader = initCommandLoader(config.searchPrefix);
	let builtInCommands: LoadedCommands, installedCommands: LoadedCommands;

	try{
		const builtInCommandsPaths = await enumerateBuiltInCommands();
		const installedCommandsPaths = await enumerateInstalledCommands(config);
		builtInCommands = await loadCommands(builtInCommandsPaths, builtInCommandLoader);
		installedCommands = await loadCommands(installedCommandsPaths, installedCommandLoader);
		//combine the inbuilt and installed commands - last in wins when keys clash
		const commands = new Map([...installedCommands.commandsMap, ...builtInCommands.commandsMap]);
		const yargsCommandNames = new Map([...installedCommands.yargsCommandNames, ...builtInCommands.yargsCommandNames]);
		registerCommands(yargs, commands, yargsCommandNames);
	} catch (err){
		console.log(`Some commands are not available: ${err}`);
	}

}

init();
