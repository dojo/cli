import { loadCommands, enumerateInstalledCommands, enumerateBuiltInCommands } from './loadCommands';
import { GroupMap, CommandMap, LoggingHelper } from './interfaces';
import { initCommandLoader, createBuiltInCommandLoader } from './command';
import config from './config';

export async function loadExternalCommands(logging: LoggingHelper): Promise<GroupMap> {
	const installedCommandLoader = initCommandLoader(config.searchPrefixes);
	const installedCommandsPaths = await enumerateInstalledCommands(config);
	return await loadCommands(installedCommandsPaths, installedCommandLoader, logging);
}

export async function loadBuiltInCommands(logging: LoggingHelper): Promise<GroupMap> {
	const builtInCommandLoader = createBuiltInCommandLoader();
	const builtInCommandsPaths = await enumerateBuiltInCommands(config);
	return await loadCommands(builtInCommandsPaths, builtInCommandLoader, logging);
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

export default async function loadAllCommands(logging: LoggingHelper): Promise<GroupMap> {
	const builtInCommands = await loadBuiltInCommands(logging);
	const installedCommands = await loadExternalCommands(logging);

	return Promise.resolve(combineGroupMaps(builtInCommands, installedCommands));
}
