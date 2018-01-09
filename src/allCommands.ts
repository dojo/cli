import {
	loadCommands,
	enumerateInstalledCommands,
	enumerateBuiltInCommands,
	LoadedCommands,
	YargsCommandNames,
	isEjected,
	setDefaultGroup
} from './loadCommands';
import {
	initCommandLoader,
	createBuiltInCommandLoader,
	CommandsMap,
	CommandWrapper }
	from './command';
import config from './config';
import * as chalk from 'chalk';
import { NpmPackageDetails } from './interfaces';

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

export function createInstallableCommandPrompts(availableCommands: NpmPackageDetails[]): LoadedCommands {
	const commandsMap: CommandsMap = new Map();
	const yargsCommandNames: YargsCommandNames = new Map();
	const regEx = /@dojo\/cli-([^-]+)-(.+)/;

	availableCommands.forEach((command) => {
		const [ , group, name ] = regEx.exec(command.name) as string[];
		const compositeKey = `${group}-${name}`;
		const installCommand = `npm i ${command.name}`;
		const commandWrapper: CommandWrapper = {
			name,
			group,
			path: installCommand,
			description: command.description,
			register: () => {},
			run: () => {
				console.log(`\nTo install this command run ${chalk.green(installCommand)}\n`);
				return Promise.resolve();
			}
		};

		if (!isEjected(group, name)) {
			if (!commandsMap.has(group)) {
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
	});

	return {
		commandsMap,
		yargsCommandNames
	};
}

export default async function loadAllCommands(availableCommands: NpmPackageDetails[]): Promise<LoadedCommands> {
	if (loaded) {
		return Promise.resolve(commands);
	}

	const installableCommandPrompts = createInstallableCommandPrompts(availableCommands);
	const builtInCommands = await loadBuiltInCommands();
	const installedCommands = await loadExternalCommands();

	commands.commandsMap = new Map([...installableCommandPrompts.commandsMap, ...installedCommands.commandsMap, ...builtInCommands.commandsMap]);
	commands.yargsCommandNames = new Map([...installableCommandPrompts.yargsCommandNames, ...installedCommands.yargsCommandNames, ...builtInCommands.yargsCommandNames]);
	loaded = true;
	return Promise.resolve(commands);
}
