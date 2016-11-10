import { Config } from './config';
import { CommandsMap, CommandWrapper } from './command';
import * as globby from 'globby';
import { resolve, join } from 'path';

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
 * N.B. we cant return globby's promise as its not a native node Promise, but a 'pinky-promise' - LOL
 * @param config
 * @returns {Promise<string []>} the paths of all installed commands
 */
export async function enumerateInstalledCommands (config: Config) : Promise <string []> {
	const globPaths = config.searchPaths.map((depPath) => resolve(depPath, `${config.searchPrefix}-*`));
	return new Promise<string[]>((resolve, reject) => {
		globby(globPaths, (<globby.Options> { ignore: '**/*.map' }))
			.then((paths) => {
				resolve(paths);
			});
	});
}

/**
 * Enumerate all the builtIn commands and return their absolute paths
 * @returns {Promise<string []>} the paths of all builtIn commands
 */
export async function enumerateBuiltInCommands () : Promise <string []> {
	const builtInCommandParentDirGlob = join(__dirname, '/commands/*.js');
	return new Promise<string[]>((resolve, reject) => {
		globby(builtInCommandParentDirGlob)
			.then((paths) => {
				resolve(paths);
			}, reject);
	});
}

/**
 * Function to load commands given a search path and a load function. The load
 * function is injected for the purposes of abstraction and testing.
 * The commands are stored in a CommandsMap which uses a composite key of
 * group-name to store the Command. Currently the first of each group is
 * stored as the default command for that group.
 *
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
				commandsMap.set(compositeKey, commandWrapper);

				const groupCommandNames = yargsCommandNames.get(group);
				if(groupCommandNames){
					groupCommandNames.add(compositeKey);
				}
			}
			catch (error) {
				reject(`Failed to load module: ${path}, error: ${error.message}`);
			}
		});

		resolve({
			commandsMap,
			yargsCommandNames
		});
	});
}
