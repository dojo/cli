import { Config } from './config';
import { CommandsMap, CommandWrapper } from './command';
import * as globby from 'globby';
import { resolve as pathResolve, join } from 'path';

export type YargsCommandNames = Map<string, Set<string>>

export type LoadedCommands = {
	commandsMap: CommandsMap,
	yargsCommandNames: YargsCommandNames
}

function setDefaultGroup(commandsMap: CommandsMap, commandName: string, commandWrapper: CommandWrapper) {
	commandsMap.set(commandName, commandWrapper);
}

/**
 * Enumerate all the installed commands and return their absolute paths
 * N.B. we return globby's promise (its not a native node Promise, but a 'pinky-promise' wrapper) - LOL
 * @param config
 * @returns {Promise<string []>} the paths of all installed commands
 */
export async function enumerateInstalledCommands (config: Config): Promise <string []> {
	const { searchPrefixes } = config;
	const globPaths = searchPrefixes.reduce((globPaths: string[], key) => {
		return globPaths.concat(config.searchPaths.map((depPath) => pathResolve(depPath, `${key}-*`)));
	}, []);
	return globby(globPaths, (<globby.Options> { ignore: '**/*.map' }));
}

/**
 * Enumerate all the builtIn commands and return their absolute paths
 * @param config
 * @returns {Promise<string []>} the paths of all builtIn commands
 */
export async function enumerateBuiltInCommands (config: Config): Promise <string []> {
	const builtInCommandParentDirGlob = join(config.builtInCommandLocation, '/*.js');
	return globby(builtInCommandParentDirGlob, (<globby.Options> { ignore: '**/*.map' }));
}

/**
 * Function to load commands given a search path and a load function. The load
 * function is injected for the purposes of abstraction and testing.
 * The commands are stored in a CommandsMap which uses a composite key of
 * group-name to store the Command. Currently the first of each group is
 * stored as the default command for that group.
 *
 * @param paths array of absolute paths to commands
 * @param load The load function, this takes a path and loads it using the searchPrefix
 * 	that it was pre-configured to look for.
 * @returns Promise This function is async and returns a promise once all
 * of the commands have been loaded.
 */
export async function loadCommands(paths: string[], load: (path: string) => CommandWrapper ): Promise <LoadedCommands> {
	return new Promise <LoadedCommands> ((resolve, reject) => {
		const commandsMap: CommandsMap = new Map();
		const yargsCommandNames: YargsCommandNames = new Map();

		paths.forEach((path) => {
			try {
				const commandWrapper = load(path);
				const {group, name} = commandWrapper;
				const compositeKey = `${group}-${name}`;

				if (!commandsMap.has(group)) {
					// First of each type will be 'default' for now
					setDefaultGroup(commandsMap, group, commandWrapper);
					yargsCommandNames.set(group, new Set());
				}

				if (!commandsMap.has(compositeKey)) {
					commandsMap.set(compositeKey, commandWrapper);
				}

				const groupCommandNames = yargsCommandNames.get(group);
				if (groupCommandNames) {
					groupCommandNames.add(compositeKey);
				}
			}
			catch (error) {
				error.message = `Failed to load module ${path}\nNested error: ${error.message}`;
				reject(error);
			}
		});

		resolve({
			commandsMap,
			yargsCommandNames
		});
	});
}
