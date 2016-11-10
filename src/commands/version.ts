import { CommandsMap } from '../command';
import { Command, Helper } from '../interfaces';
import dirname from '../dirname';
import {
	versionNoRegisteredCommands,
	versionRegisteredCommands,
	versionCurrentVersion,
	versionNoVersion
} from '../text';
import { join } from 'path';
import { Yargs, Argv } from 'yargs';

const david = require('david');
const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);

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

const command: Command = {
	name: 'version',
	group: 'version',
	description: 'Provides version information for all installed commands and the cli itself.',
	register,
	run
};
export default command;

function register(helper: Helper): Yargs {
	helper.yargs.option('outdated', {
		alias: 'outdated',
		describe: 'Output a list of installed commands that can be updated to a more recent stable version.',
		demand: false,
		type: 'string'
	});
	return helper.yargs;
}

export interface VersionArgs extends Argv {
	outdated: string;
}

function run(helper: Helper, args: VersionArgs): Promise<any> {
	const checkOutdated = args.outdated !== undefined;
	if(checkOutdated){
		console.log('Fetching latest version information...');
	}

	const installedCommands = helper.commandsMap;
	return createVersionsString(installedCommands, checkOutdated)
		.then((data) => {
			console.log(data);
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
function buildVersions(commandsMap: CommandsMap):Promise<any> {
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

	const versionInfo = consolidatedCommands.map(([path, group]) => {
		const { name, version } = readPackageDetails(path);

		return {
			name,
			version,
			group
		};
	}).sort((a, b) => a.group > b.group ? 1 : -1);
	return Promise.resolve(versionInfo);
}


/**
 * Iterate through a CommandsMap and output if the module can be updated to a later version.
 * Version checks are async calls to npm - so module repository dependant for now.
 *
 * @param {CommandsMap} commandsMap
 * @returns {{name, version, group}[]}
 */
function areCommandsOutdated(commandsMap: ModuleVersion[]): Promise<any> {
	//convert [ModuleVersion] = [{commandPackageName: commandPackageVersion}]
	var deps: {}[] = commandsMap
		.filter((command) => {
			//remove inbuilt commands or commands that dont have a valid version in the package.json
			return command.version !== versionNoVersion;
		})
		.map((command) => {
			let obj:any = {};
			obj[command.name] = command.version;
			return obj
		});

	let manifest = {
		name: 'xyz',    //check if needed
		dependencies: {},   //required by david even if no deps
		devDependencies: deps
	};


	let prom = new Promise((resolve, reject) => {
		//we want to fetch the latest stable version for our devDependencies
		david.getUpdatedDependencies(manifest, { dev: true, stable: true }, function (er : any, deps: any) {
			if(er){
				reject(er);
			}
			resolve(commandsMap.map((command) => {
				const canBeUpdated = deps[command.name];    //david returns all deps that can be updated
				const versionStr = canBeUpdated ?
					`${command.version} (can be updated to ${deps[command.name].stable}).` :
					`${command.version} (on latest stable version).`;
				return {
					name: command.name,
					version: versionStr,
					group: command.group
				}
			}));
		});
	});
	return prom;
}

/**
 * Returns a string describing the command group, module name, and module version of each
 * command referenced in a specified CommandsMap. This is used to print the the help string.
 *
 * @param {CommandsMap} commandsMap
 * @returns {string}
 */
function createVersionsString(commandsMap: CommandsMap, checkOutdated: boolean): Promise<any> {

	const myPackageDetails = readPackageDetails(packagePath);
	const versionProm = buildVersions(commandsMap);

	return versionProm.then((commandVersions : ModuleVersion[]) => {
		if(checkOutdated){
			return areCommandsOutdated(commandVersions)
				.then((commandVersions: ModuleVersion[]) => {
					return outputVersionInfo(myPackageDetails, commandVersions);
				});
		} else {
			return outputVersionInfo(myPackageDetails, commandVersions);
		}
	}, (err) => {
		return 'Something went wrong trying to fetch command versions'
	});
}

function outputVersionInfo(myPackageDetails: PackageDetails, commandVersions: ModuleVersion[]){
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
