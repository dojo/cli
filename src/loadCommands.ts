import { Yargs } from 'yargs';
import { Config } from './config';
import { CommandsMap, CommandWrapper } from './command';
import * as globby from 'globby';
import { resolve } from 'path';

export interface YargsCommandNames {
	[property: string]: Set<string>;
};

export type LoadedCommands = {
	commandsMap: CommandsMap,
	yargsCommandNames: YargsCommandNames
}

function setDefaultGroup(commandsMap: CommandsMap, commandName: string, commandWrapper: CommandWrapper) {
	commandsMap.set(commandName, commandWrapper);
}

/**
 * Function to load commands given a search path and a load function. The load
 * function is injected for the purposes of abstraction and testing.
 * The commands are stored in a CommandsMap which uses a composite key of
 * group-name to store the Command. Currently the first of each group is
 * stored as the default command for that group.
 *
 * @param yargs This is just the required yargs
 * @param config contains searchPaths used to look for commands to load.
 * @param load The load function, this takes a path and loads it using the searchPrefix
 * 	that it was pre-configured to look for.
 * @returns Promise This function is async and returns a promise once all
 * of the commands have been loaded.
 */
export default async function (yargs: Yargs, config: Config, load: (path: string) => CommandWrapper ): Promise <LoadedCommands> {
	const globPaths = config.searchPaths.map((depPath) => resolve(depPath, `${config.searchPrefix}-*`));
	const promise = new Promise <LoadedCommands> ((resolve, reject) => {
		globby(globPaths, (<globby.Options> { ignore: '**/*.map' })).then((paths) => {
			const commandsMap: CommandsMap = new Map();
			const yargsCommandNames: YargsCommandNames = {};

			paths.forEach((path) => {
				try {
					const commandWrapper = load(path);
					const { group, name } = commandWrapper;
					const compositeKey = `${group}-${name}`;

					if (!commandsMap.has(group)) {
						// First of each type will be 'default' for now
						setDefaultGroup(commandsMap, group, commandWrapper);

						yargsCommandNames[group] = new Set();
					}

					if (!commandsMap.has(compositeKey)) {
						commandsMap.set(compositeKey, commandWrapper);
					}

					const groupCommandNames = yargsCommandNames[group];
					groupCommandNames.add(compositeKey);
				}
				catch (error) {
					console.error(`Failed to load module: ${path}, error: ${error.message}`);
				}
			});

			resolve({
				commandsMap,
				yargsCommandNames
			});

		}, reject);
	});

	return promise;
}
