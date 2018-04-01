import * as execa from 'execa';
import { join } from 'path';
const spawn: any = require('cross-spawn');
import { NpmPackageDetails, CommandWrapper, GroupMap } from './interfaces';
import * as Configstore from 'configstore';
import { isEjected } from './loadCommands';
import chalk from 'chalk';

const INITIAL_TIMEOUT = 3000;
const ONE_DAY = 1000 * 60 * 60 * 24;

export default async function(name: string): Promise<NpmPackageDetails[]> {
	const conf = new Configstore(name);

	let commands: NpmPackageDetails[] = conf.get('commands') || [];
	if (commands.length) {
		const lastUpdated = conf.get('lastUpdated');
		if (Date.now() - lastUpdated >= ONE_DAY) {
			spawn(process.execPath, [join(__dirname, 'detachedCheckForNewCommands.js'), JSON.stringify({ name })], {
				detached: true,
				stdio: 'ignore'
			}).unref();
		}
	} else {
		commands = await getLatestCommands(name);
	}

	return commands;
}

export async function getLatestCommands(name: string): Promise<NpmPackageDetails[]> {
	const conf = new Configstore(name);
	const commands = await search(INITIAL_TIMEOUT);
	if (commands && commands.length) {
		conf.set('commands', commands);
		conf.set('lastUpdated', Date.now());
	}
	return commands || [];
}

async function search(timeout: number = 0): Promise<NpmPackageDetails[] | undefined> {
	try {
		const { stdout } = await execa('npm', ['search', '@dojo', 'cli-', '--json', '--searchstaleness', '0'], {
			timeout
		});
		const commands = JSON.parse(stdout);
		return commands.filter(({ name }: NpmPackageDetails) => {
			return /^@dojo\/cli-/.test(name);
		});
	} catch (e) {
		console.error('Invalid response from npm search');
	}
}

export function mergeInstalledCommandsWithAvailableCommands(
	groupMap: GroupMap,
	availableCommands: NpmPackageDetails[]
): GroupMap {
	const regEx = /@dojo\/cli-([^-]+)-(.+)/;

	availableCommands.forEach((command) => {
		const [, group, name] = regEx.exec(command.name) as string[];
		const installCommand = `npm i ${command.name}`;

		const commandWrapper: CommandWrapper = {
			name,
			group,
			path: installCommand,
			description: command.description,
			global: false,
			installed: false,
			register: () => {},
			run: () => {
				console.log(`\nTo install this command run ${chalk.green(installCommand)}\n`);
				return Promise.resolve();
			}
		};

		if (!isEjected(group, name)) {
			if (!groupMap.has(group)) {
				commandWrapper.default = true;
				groupMap.set(group, new Map());
			}

			const subCommandsMap = groupMap.get(group)!;
			if (!subCommandsMap.has(name)) {
				subCommandsMap.set(name, commandWrapper);
			}
		}
	});

	return groupMap;
}
