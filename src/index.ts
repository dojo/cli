import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import loadCommands from './loadCommands';
import registerCommands from './registerCommands';
import { load, setSearchPrefix } from './command';
const pkg = <any> require('../../package.json');

async function init() {
	updateNotifier(pkg, 0);
	setSearchPrefix(config.searchPrefix);
	const { commandsMap, yargsCommandNames } = await loadCommands(yargs, config, load);
	registerCommands(yargs, commandsMap, yargsCommandNames);
}

init();
