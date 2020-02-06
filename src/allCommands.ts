import { loadCommands, enumerateInstalledCommands, enumerateBuiltInCommands } from './loadCommands';
import { GroupMap, CommandMap } from './interfaces';
import { initCommandLoader, createBuiltInCommandLoader } from './command';
import config from './config';

export async function loadExternalCommands(group?: string): Promise<GroupMap> {
	group = group !== undefined ? group : process.argv[2];
	const installedCommandLoader = initCommandLoader(config.searchPrefixes);
	const installedCommandsPaths = await enumerateInstalledCommands(config, group);
	return await loadCommands(installedCommandsPaths, installedCommandLoader);
}

export async function loadBuiltInCommands(): Promise<GroupMap> {
	const builtInCommandLoader = createBuiltInCommandLoader();
	const builtInCommandsPaths = await enumerateBuiltInCommands(config);
	return await loadCommands(builtInCommandsPaths, builtInCommandLoader);
}

export function combineGroupMaps(builtInCommands: GroupMap, installedCommands: GroupMap): GroupMap {
	const combinedCommands = new Map([...installedCommands]);

	builtInCommands.forEach((group, groupKey) => {
		if (combinedCommands.has(groupKey)) {
			combinedCommands.set(groupKey, new Map([...(<CommandMap>combinedCommands.get(groupKey)), ...group]));
		} else {
			combinedCommands.set(groupKey, group);
		}
	});

	return combinedCommands;
}

export default async function loadAllCommands(): Promise<GroupMap> {
	const builtInCommands = await loadBuiltInCommands();
	const installedCommands = await loadExternalCommands();

	return Promise.resolve(combineGroupMaps(builtInCommands, installedCommands));
}
