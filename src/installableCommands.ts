import * as execa from 'execa';
import { join } from 'path';
const cs: any = require('cross-spawn');
import { NpmPackageDetails, LoadedCommands,	YargsCommandNames, CommandsMap, CommandWrapper } from './interfaces';
import * as Configstore from 'configstore';
import { isEjected, setDefaultGroup } from './loadCommands';
import chalk from 'chalk';

const INITIAL_TIMEOUT = 3000;
const ONE_DAY = 1000 * 60 * 60 * 24;

export default async function(name: string): Promise<NpmPackageDetails[]> {
	const conf = new Configstore(name);

	let commands: NpmPackageDetails[] = conf.get('commands') || [];
	if (!commands.length) {
		commands = await getLatestCommands(name, conf);
	} else {
		const lastUpdated = conf.get('lastUpdated');
		if (Date.now() - lastUpdated >= ONE_DAY) {
			cs.spawn(process.execPath, [join(__dirname, 'detachedCheckForNewCommands.js'), JSON.stringify({ name }) ], {
				detached: true,
				stdio: 'ignore'
			}).unref();
		}
	}

	return commands;
}

export async function getLatestCommands(packageName: string, conf: Configstore): Promise<NpmPackageDetails[]> {
	let commands: NpmPackageDetails[] = [];

	commands = await search(INITIAL_TIMEOUT);
	conf.set('commands', commands);
	conf.set('lastUpdated', Date.now());

	return commands;
}

async function search(timeout: number = 0): Promise<NpmPackageDetails[]> {
	return execa('npm', ['search', '@dojo', 'cli-', '--json', '--searchstaleness', '0'], { timeout }).then(result => {
		const commands = JSON.parse(result.stdout);
		return commands.filter(({ name }: NpmPackageDetails) => {
			return name !== '@dojo/cli';
		});
	});
}

export function mergeInstalledCommandsWithAvailableCommands(installedCommands: LoadedCommands, availableCommands: NpmPackageDetails[]) {
	const installableCommandPrompts = createInstallableCommandPrompts(availableCommands);

	const allGroups = new Set([...installableCommandPrompts.yargsCommandNames.keys(), ...installedCommands.yargsCommandNames.keys()]);

	const mergedYargsCommandNames = [...allGroups].reduce((mergedCommandNames: YargsCommandNames, groupName) => {
		const installedGroup = installedCommands.yargsCommandNames.get(groupName) || [];
		const installableGroup = installableCommandPrompts.yargsCommandNames.get(groupName) || [];
		const mergedSets = new Set([...installableGroup, ...installedGroup]);
		mergedCommandNames.set(groupName, mergedSets);
		return mergedCommandNames;
	}, new Map() as YargsCommandNames);

	return {
		commandsMap: new Map([...installableCommandPrompts.commandsMap, ...installedCommands.commandsMap]),
		yargsCommandNames: mergedYargsCommandNames
	};
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
