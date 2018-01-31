import { loadCommands, enumerateInstalledCommands, enumerateBuiltInCommands } from './loadCommands';
import { LoadedCommands } from './interfaces';
import { initCommandLoader, createBuiltInCommandLoader } from './command';
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

export async function loadExternalCommands(): Promise<LoadedCommands> {
	const installedCommandLoader = initCommandLoader(config.searchPrefixes);
	const installedCommandsPaths = await enumerateInstalledCommands(config);
	return await loadCommands(installedCommandsPaths, installedCommandLoader);
}

export async function loadBuiltInCommands(): Promise<LoadedCommands> {
	const builtInCommandLoader = createBuiltInCommandLoader();
	const builtInCommandsPaths = await enumerateBuiltInCommands(config);
	return await loadCommands(builtInCommandsPaths, builtInCommandLoader);
}

export default async function loadAllCommands(): Promise<LoadedCommands> {
	if (loaded) {
		return Promise.resolve(commands);
	}

	const builtInCommands = await loadBuiltInCommands();
	const installedCommands = await loadExternalCommands();

	commands.commandsMap = new Map([...installedCommands.commandsMap, ...builtInCommands.commandsMap]);
	commands.yargsCommandNames = new Map([
		...installedCommands.yargsCommandNames,
		...builtInCommands.yargsCommandNames
	]);
	loaded = true;
	return Promise.resolve(commands);
}
