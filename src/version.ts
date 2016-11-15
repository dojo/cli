import { CommandsMap } from './command';
import {
	versionNoRegisteredCommands,
	versionRegisteredCommands,
	versionCurrentVersion,
	versionNoVersion
} from './text';
import { join } from 'path';

const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(__dirname);

/**
 * The details of one command group's module.
 */
export interface ModuleVersion {
	name: string;
	version: string;
	group: string;
}

/**
 * Important information to be retrieved from a module's package.json
 */
export interface PackageDetails {
	name: string;
	version: string;
}

/**
 * Read information about a package/module, if available, or return default values.
 *
 * @param {string} packageDir The directory containing the package.json file.
 * @returns {{name: (any|string), version: any}}
 */
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

/**
 * Iterate through a CommandsMap and retrieve the module details of each module referenced in the
 * CommandsMap. The returned list is sorted in alphabetical order, by group.
 *
 * @param {CommandsMap} commandsMap
 * @returns {{name, version, group}[]}
 */
export function buildVersions(commandsMap: CommandsMap): ModuleVersion[] {
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

/**
 * Returns a string describing the command group, module name, and module version of each
 * command referenced in a specified CommandsMap. This is used to print the the help string.
 *
 * @param {CommandsMap} commandsMap
 * @returns {string}
 */
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
