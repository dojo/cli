import { CommandsMap } from './command';
import dirname from './dirname';
import {
	versionNoRegisteredCommands,
	versionRegisteredCommands,
	versionCurrentVersion,
	versionNoVersion
} from './text';
import { join } from 'path';

const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);

export interface ModuleVersion {
	name: string;
	version: string;
	group: string;
}

export interface PackageDetails {
	name: string;
	version: string;
}

export function readPackageDetails(packageDir: string): PackageDetails {
	let data: any = {};
	try {
		data = require(join(packageDir, 'package.json'));
	} catch (e) {
		data = {};
	}

	return {
		name: data.name || packageDir,
		version: data.version || versionNoVersion
	};
}

export function buildVersions(commandsMap: CommandsMap) {
	/*
	 * commandsMap comes in as a map of [command-name, command]. The command has a default command,
	 * the map will actually contain two entries for one command, on for the default command, one for the real,
	 * expanded, command.
	 *
	 * Loop over commandsMap and create a new map with one entry per command, then loop over each entry and extract
	 * the package details.
	 */
	const consolidatedCommands = [ ...new Map<string, string>([ ...commandsMap ]
		.map(([, command]) => <[string, string]> [ command.path, command.group ])) ];

	return consolidatedCommands.map(([path, group]) => {
			const { name, version } = readPackageDetails(path);

			return {
				name,
				version,
				group
			};
		}).sort((a, b) => a.group > b.group ? 1 : -1);
}

export default function createVersionsString(commandsMap: CommandsMap): string {
	const myPackageDetails = readPackageDetails(packagePath),
		commands = buildVersions(commandsMap);
	let output = '';

	if (commands.length) {
		output += versionRegisteredCommands;
		output += '\n'
			+ commands.map((command) => `${command.group} (${command.name}) ${command.version}`).join('\n')
			+ '\n';
	}
	else {
		output += versionNoRegisteredCommands;
	}

	output += versionCurrentVersion.replace('\{version\}', myPackageDetails.version);

	return output;
}
