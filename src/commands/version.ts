import { CommandsMap } from '../command';
import { Helper, OptionsHelper } from '../interfaces';
import { join } from 'path';
import { Argv, Options } from 'yargs';
import { yellow } from 'chalk';
import allCommands from '../allCommands';
const david = require('david');
const pkgDir = require('pkg-dir');

// exported for tests
export const versionCurrentVersion = `
You are currently running @dojo/cli {version}
`;
export const versionNoRegisteredCommands = `
There are no registered commands available.`;
export const versionNoVersion = yellow('package.json missing');
export const versionRegisteredCommands = `
The currently installed groups are:
`;
const INBUILT_COMMAND_VERSION = '__IN_BUILT_COMMAND__';

/**
 * The details of one command group's module.
 */
interface ModuleVersion {
	name: string;
	version: string;
	group: string;
}

/**
 * Important information to be retrieved from a module's package.json
 */
interface PackageDetails {
	name: string;
	version: string;
}

export interface VersionArgs extends Argv {
	outdated: boolean;
}

type DavidDependencies = {
	[dependencyName: string]: {
		stable: string;
		latest: string;
	}
}

/**
 * Iterate through a ModuleVersions and output if the module can be updated to a later version.
 * Version checks are async calls to npm - so module repository dependant for now.
 *
 * @param {ModuleVersion[]} moduleVersions
 * @returns {{name, version, group}[]}
 */
function areCommandsOutdated(moduleVersions: ModuleVersion[]): Promise<any> {
	const deps: { [index: string]: string } = {};

	moduleVersions.forEach((command) => {
		deps[command.name] = command.version;
	});

	// create fake manifest (package.json) with just the dev-dependencies that we want to check
	const manifest = {
		devDependencies: deps
	};

	return new Promise((resolve, reject) => {
		// we want to fetch the latest stable version for our devDependencies
		david.getUpdatedDependencies(manifest, { dev: true }, function (err: any, deps: DavidDependencies) {
			if (err) {
				reject(err);
			}
			resolve(moduleVersions.map((command) => {
				const canBeUpdated = deps[command.name];    // david returns all deps that can be updated
				const versionStr = canBeUpdated ?
					`${command.version} ${yellow(`(can be updated to ${deps[command.name].latest})`)}.` :
					`${command.version} (on latest stable version).`;
				return {
					name: command.name,
					version: versionStr,
					group: command.group
				};
			}));
		});
	});
}

/**
 * Is the command a built in command as opposed to an installed command
 * @param commandPath path to the command module
 * @returns {boolean}
 */
function isBuiltInCommand(commandPath: string): boolean {
	/*__dirname seems best as the only way to truly know if a command is built in, is by location.
	 * Since this module is a built in command, we can use our location.
	 * This was preferable to using packageDir and relative paths, because we may alter where we build to (_build/src...)
	 */
	return commandPath.startsWith(__dirname);
}

/**
 * Create the stdout output
 * @param myPackageDetails
 * @param commandVersions
 * @returns {string}
 */
function createOutput(myPackageDetails: PackageDetails, commandVersions: ModuleVersion[]) {
	let output = '';
	if (commandVersions.length) {
		output += versionRegisteredCommands;
		output += '\n'
			+ commandVersions.map((command) => `${command.group} (${command.name}) ${command.version}`).join('\n')
			+ '\n';
	}
	else {
		output += versionNoRegisteredCommands;
	}

	output += versionCurrentVersion.replace('\{version\}', myPackageDetails.version);
	return output;
}

function register(helper: Helper, options: OptionsHelper): void {
	options('o', {
		alias: 'outdated',
		describe: 'Output a list of installed commands and check if any can be updated to a more recent stable version.',
		demand: false,
		type: 'boolean'
	});
}

/**
 * Read information about a package/module, if available, or return default values.
 *
 * @param {string} packageDir The directory containing the package.json file.
 * @returns {{name: (any|string), version: any}}
 */
function readPackageDetails(packageDir: string): PackageDetails {
	let data: any = {};
	// rather than add another prop to Command, declare the command to be builtin by setting its version
	if (isBuiltInCommand(packageDir)) {
		data.version = INBUILT_COMMAND_VERSION;
	} else {
		try {
			data = require(join(packageDir, 'package.json'));
		} catch (e) {
			data.name = packageDir;
			data.version = versionNoVersion;
		}
	}

	return {
		name: data.name,
		version: data.version
	};
}

/**
 * Iterate through a CommandsMap and retrieve the module details of each module referenced in the
 * CommandsMap. The returned list is sorted in alphabetical order, by group.
 *
 * @param {CommandsMap} commandsMap
 * @returns {{name, version, group}[]}
 */
function buildVersions(commandsMap: CommandsMap): ModuleVersion[] {
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

	const versionInfo = consolidatedCommands
		.map(([path, group]) => {
			const { name, version } = readPackageDetails(path);

			return {
				name,
				version,
				group
			};
		})
		.filter((val) => {
			// remove inbuilt commands or commands that dont have a valid version in the package.json
			return val.version !== versionNoVersion && val.version !== INBUILT_COMMAND_VERSION;
		})
		.sort((a, b) => a.group > b.group ? 1 : -1);
	return versionInfo;
}

/**
 * Returns a string describing the command group, module name, and module version of each
 * command referenced in a specified CommandsMap. This is used to print the string.
 *
 * @param {CommandsMap} commandsMap maps of commands to output the versions for
 * @param {boolean} checkOutdated should we check if there is a later stable version available for the command
 * @returns {string} the stdout output
 */
function createVersionsString(commandsMap: CommandsMap, checkOutdated: boolean): Promise<string> {
	const packagePath = pkgDir.sync(__dirname);
	const myPackageDetails = readPackageDetails(packagePath);	// fetch the cli's package details
	const versions: ModuleVersion[] = buildVersions(commandsMap);

	if (checkOutdated) {
		return areCommandsOutdated(versions)
			.then((commandVersions: ModuleVersion[]) => createOutput(myPackageDetails, commandVersions),
				(err) => {
					return `Something went wrong trying to fetch command versions: ${err.message}`;
				});
	} else {
		return Promise.resolve(createOutput(myPackageDetails, versions));
	}
}

function run(helper: Helper, args: VersionArgs): Promise<any> {
	const checkOutdated = args.outdated;
	if (checkOutdated) {
		console.log('Fetching latest version information...');
	}

	return allCommands()
		.then((commands) => {
			return createVersionsString(commands.commandsMap, checkOutdated);
		})
		.then(console.log);
}

export default {
	name: '',
	group: 'version',
	description: 'provides version information for all installed commands and the cli itself.',
	register,
	run
};
