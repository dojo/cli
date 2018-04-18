import { loadCommands, enumerateInstalledCommands, enumerateBuiltInCommands } from './loadCommands';
import { GroupMap } from './interfaces';
import { initCommandLoader, createBuiltInCommandLoader } from './command';
import config from './config';

export async function loadExternalCommands(): Promise<GroupMap> {
	const installedCommandLoader = initCommandLoader(config.searchPrefixes);
	const installedCommandsPaths = await enumerateInstalledCommands(config);
	return await loadCommands(installedCommandsPaths, installedCommandLoader);
}

export async function loadBuiltInCommands(): Promise<GroupMap> {
	const builtInCommandLoader = createBuiltInCommandLoader();
	const builtInCommandsPaths = await enumerateBuiltInCommands(config);
	return await loadCommands(builtInCommandsPaths, builtInCommandLoader);
}

export default async function loadAllCommands(): Promise<GroupMap> {
	const builtInCommands = await loadBuiltInCommands();
	const installedCommands = await loadExternalCommands();

	return Promise.resolve(new Map([...installedCommands, ...builtInCommands]));
}
