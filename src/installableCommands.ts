import * as execa from 'execa';
import { NpmPackageDetails } from './interfaces';
import * as Configstore from 'configstore';

const INITIAL_TIMEOUT = 3000;

export default async function(name: string) {
	const conf = new Configstore(name);

	let commands: NpmPackageDetails[] = conf.get('commands') || [];
	if (!commands.length) {
		commands = await getLatestCommands(name, conf);
	}

	return commands;
}

async function getLatestCommands(packageName: string, conf: Configstore): Promise<NpmPackageDetails[]> {
	let commands: NpmPackageDetails[] = [];

	try {
		commands = await search(INITIAL_TIMEOUT);
		conf.set('commands', commands);
		conf.set('lastUpdated', Date.now());
	}
	catch (error) {
		// console.log('\nProcess timed out when fetching command list');
	}

	return commands;
}

async function search(timeout: number = 0): Promise<NpmPackageDetails[]> {
	console.log('FETCHING');
	return execa('npm', ['search', '@dojo', 'cli-', '--json'], { timeout }).then(result => {
		const commands = JSON.parse(result.stdout);
		return commands.filter(({ name }: NpmPackageDetails) => {
			return name !== '@dojo/cli';
		});
	});
}
