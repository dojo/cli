import * as globby from 'globby';
import { resolve as pathResolve, join } from 'path';
import { CliConfig, CommandWrapper, GroupMap } from './interfaces';
import configurationHelper from './configurationHelper';

export function isEjected(groupName: string, command: string): boolean {
	const config: any = configurationHelper.sandbox(groupName, command).get();
	return config && config['ejected'];
}

/**
 * Enumerate all the installed commands and return their absolute paths
 * N.B. we return globby's promise (its not a native node Promise, but a 'pinky-promise' wrapper) - LOL
 * @param config
 * @returns {Promise<string []>} the paths of all installed commands
 */
export async function enumerateInstalledCommands(config: CliConfig): Promise<string[]> {
	const { searchPrefixes } = config;
	const globPaths = searchPrefixes.reduce((globPaths: string[], key) => {
		return globPaths.concat(config.searchPaths.map((depPath) => pathResolve(depPath, `${key}-*`)));
	}, []);
	return globby(globPaths, { ignore: '**/*.{map,d.ts}' });
}

/**
 * Enumerate all the builtIn commands and return their absolute paths
 * @param config
 * @returns {Promise<string []>} the paths of all builtIn commands
 */
export async function enumerateBuiltInCommands(config: CliConfig): Promise<string[]> {
	const builtInCommandParentDirGlob = join(config.builtInCommandLocation, '/*.js');
	return globby(builtInCommandParentDirGlob, { ignore: '**/*.{map,d.ts}' });
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
export async function loadCommands(paths: string[], load: (path: string) => CommandWrapper): Promise<GroupMap> {
	return new Promise<GroupMap>((resolve, reject) => {
		const specialCommandsMap: GroupMap = new Map();

		paths.forEach((path) => {
			try {
				const commandWrapper = load(path);
				const { group, name } = commandWrapper;

				if (!isEjected(group, name)) {
					if (!specialCommandsMap.has(group)) {
						commandWrapper.default = true;
						specialCommandsMap.set(group, new Map());
					}

					const commandsMap = specialCommandsMap.get(group)!;
					if (!specialCommandsMap.get(group)!.has(name)) {
						commandsMap.set(name, commandWrapper);
					}
				}
			} catch (error) {
				error.message = `Failed to load module ${path}\nNested error: ${error.message}`;
				reject(error);
			}
		});

		resolve(specialCommandsMap);
	});
}
