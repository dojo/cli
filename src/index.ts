import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import loadCommands from './loadCommands';
import registerCommands from './registerCommands';
import { initCommandLoader } from './command';
const pkg = <any> require('../../package.json');

async function init() {
	updateNotifier(pkg, 0);
	const commandLoader = initCommandLoader(config.searchPrefix);
	const { commandsMap, yargsCommandNames } = await loadCommands(yargs, config, commandLoader);
	registerCommands(yargs, commandsMap, yargsCommandNames);
}

init();
