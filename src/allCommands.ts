import {
	loadCommands,
	enumerateInstalledCommands,
	enumerateBuiltInCommands,
	LoadedCommands
} from './loadCommands';
import {
	initCommandLoader,
	createBuiltInCommandLoader }
	from './command';
import config from './config';

const commands: LoadedCommands = {
	commandsMap: new Map(),
	yargsCommandNames: new Map()
};

let loaded = false;

export function reset(): void {
	commands.commandsMap = new Map();
	commands.yargsCommandNames = new Map();
	loaded = false;
}

export default async function loadAllCommands(): Promise<LoadedCommands> {
	if (loaded) {
		return Promise.resolve(commands);
	}

	const builtInCommandLoader = createBuiltInCommandLoader();
	const installedCommandLoader = initCommandLoader(config.searchPrefix);

	const builtInCommandsPaths = await enumerateBuiltInCommands(config);
	const installedCommandsPaths = await enumerateInstalledCommands(config);
	const builtInCommands = await loadCommands(builtInCommandsPaths, builtInCommandLoader);
	const installedCommands = await loadCommands(installedCommandsPaths, installedCommandLoader);

	commands.commandsMap = new Map([...installedCommands.commandsMap, ...builtInCommands.commandsMap]);
	commands.yargsCommandNames = new Map([...installedCommands.yargsCommandNames, ...builtInCommands.yargsCommandNames]);
	loaded = true;

	return Promise.resolve(commands);
}
