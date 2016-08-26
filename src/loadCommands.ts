import { Yargs } from 'yargs';
import { Config } from './config';
import { CommandsMap, CommandWrapper } from './command';
import * as globby from 'globby';
import { resolve } from 'path';

interface YargsCommandNames {
	[property: string]: string[];
};

type LoadedCommands = {
	commandsMap: CommandsMap,
	yargsCommandNames: YargsCommandNames
}

function setDefaultGroup(commandsMap: CommandsMap, commandName: string, commandWrapper: CommandWrapper) {
	commandsMap.set(commandName, commandWrapper);
}

export default async function (yargs: Yargs, config: Config, load: (path: string) => CommandWrapper ): Promise <LoadedCommands> {
	const globPaths = config.searchPaths.map((depPath) => resolve(depPath, `${config.searchPrefix}-*`));
	const promise = new Promise <LoadedCommands> ((resolve, reject) => {
		globby(globPaths, (<globby.Options> { ignore: '**/*.map' })).then((paths) => {
			const commandsMap: CommandsMap = new Map();
			const yargsCommandNames: YargsCommandNames = {};

			paths.forEach((path) => {
				const commandWrapper = load(path);
				const { group, name } = commandWrapper;
				const compositeKey = `${group}-${name}`;

				if (!commandsMap.has(group)) {
					// First of each type will be 'default' for now
					setDefaultGroup(commandsMap, group, commandWrapper);

					yargsCommandNames[group] = [];
				}
				commandsMap.set(compositeKey, commandWrapper);
				yargsCommandNames[group].push(compositeKey);
			});

			resolve({
				commandsMap,
				yargsCommandNames
			});

		}, reject);
	});

	return promise;
}
