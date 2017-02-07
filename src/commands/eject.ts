import { existsSync, writeFileSync } from 'fs';
import { copySync, ensureDirSync } from 'fs-extra';
import { join, resolve as pathResolve } from 'path';
import { Argv } from 'yargs';
import { red, yellow, underline } from 'chalk';
import * as inquirer from 'inquirer';
import { Helper, NpmPackage, OptionsHelper } from '../interfaces';
import allCommands from '../allCommands';
import npmInstall from '../npmInstall';
const pkgDir = require('pkg-dir');

export interface EjectArgs extends Argv {
	group?: string;
	command?: string;
};

const appPath = pkgDir.sync(process.cwd());

function npmSectionReducer(pkgSection: any, plural: string, singular: string) {
	return (accumulator: any, dependency: string) => {
		console.log(`	adding ${yellow(dependency)} to ${plural}`);
		if (accumulator[dependency]) {
			console.warn(`${red('WARN')}    ${singular} ${dependency} already exists '${accumulator[dependency]}' and will be overwritten by '${pkgSection[dependency]}'`);
		}
		accumulator[dependency] = pkgSection[dependency];
	};
}

/**
 * Helper - add npm configuration to package.jsonn
 * @param {NpmPackage} package
 * @returns {void}
 */
async function handleNpmConfiguration(pkg: NpmPackage): Promise<void> {
	const appPackagePath = join(appPath, 'package.json');
	const appPackage = require(appPackagePath);
	const shouldRunNpmInstall = pkg.dependencies || pkg.devDependencies || pkg.scripts;

	pkg.devDependencies = pkg.devDependencies || {};
	pkg.dependencies = pkg.dependencies || {};
	pkg.scripts = pkg.scripts || {};

	appPackage.devDependencies = Object.keys(pkg.devDependencies)
		.reduce(
			npmSectionReducer(pkg.devDependencies, 'devDependencies', 'devDependency'),
			appPackage.devDependencies || {}
		);

	appPackage.dependencies = Object.keys(pkg.dependencies)
		.reduce(
			npmSectionReducer(pkg.dependencies, 'dependencies', 'dependency'),
			appPackage.dependencies || {}
		);

	appPackage.scripts = Object.keys(pkg.scripts)
		.reduce(
			npmSectionReducer(pkg.scripts, 'scripts', 'script'),
			appPackage.scripts || {}
		);

	if (shouldRunNpmInstall) {
		console.log(underline('running npm install...'));
		writeFileSync(appPackagePath, JSON.stringify(appPackage));
		await npmInstall();
	}
}

/**
 * Helper - copy files to current project root
 * @param {string[]} files - an array of fully-qualified file paths
 * @returns {void}
 */
function copyFiles(files: string[]): void {
	const map: { [name: string]: number } = {};

	// collect a map of partial paths and their usage counts 
	files.forEach((filePath: string) => {
		const parts: string[] = pathResolve(filePath).split('/');
		parts.forEach((part, index) => {
			const localPath = parts.slice(0, index).join('/') + '/';
			if (map[localPath]) {
				map[localPath]++;
			}
			else {
				map[localPath] = 1;
			}
		});
	});

	// find the longest common path that is used across all files
	const longestCommonPath = Object.keys(map).reduceRight((previous, current) => {
		if (map[current] === files.length) {
			return previous.length > current.length ? previous : current;
		}
		return previous;
	}, '');

	// collect only the unique local folder paths
	const folders: string[] = [];
	files.forEach((filePath: string) => {
		filePath = pathResolve(filePath).replace(longestCommonPath, '');
		const parts = filePath.split('/');
		parts.pop();
		if (parts.length) {
			folders.push(join(...parts));
		}
	});

	// veify files don't already exist
	files.forEach((filePath) => {
		const newPath = join(appPath, pathResolve(filePath).replace(longestCommonPath, ''));
		if (existsSync(newPath)) {
			throw Error(`File already exists: ${newPath}`);
		}
	});

	// create those folders within the current project
	folders.forEach((folder) => {
		const folderPath = join(appPath, folder);
		console.log(`creating folder: ${yellow(folderPath)}`);
		ensureDirSync(folderPath);
	});

	// copy over files to the current project
	console.log(underline(`\n\ncopying files into current project at: ${yellow(appPath)}`));
	files.forEach((filePath) => {
		const filePathResolved = pathResolve(filePath);
		const newPath = join(appPath, filePathResolved.replace(longestCommonPath, ''));
		console.log(`	copying ${yellow(filePathResolved)} to the project which will now be located at: ${yellow(newPath)}`);
		copySync(filePath, newPath);
	});
}

function register(options: OptionsHelper): void {
	options('g', {
		alias: 'group',
		describe: 'the group to eject commands from'
	});
	options('c', {
		alias: 'command',
		describe: 'the command to eject - a `group` is required'
	});
}

function run(helper: Helper, args: EjectArgs): Promise<any> {
	return inquirer.prompt({
		type: 'confirm',
		name: 'eject',
		message: 'Are you sure you want to eject (this is a permanent operation)?',
		default: false
	}).then((answer: { eject: boolean }) => {
		if (!answer.eject) {
			throw Error('Aborting eject');
		}
		return allCommands()
			.then((commands) => {
				// Filter out `version` and `eject` commands, ignore duplicates and grab 
				// only the commands specified via arguments to be ejected.
				const map: { [name: string]: boolean } = { 'eject/': true, 'version/': true };
				const toEject = [ ...commands.commandsMap ]
					.filter(([ , command ]) => {
						const key = `${command.group}/${command.name}`;
						const exists = map[key];
						map[key] = true;
						return !exists && (!args.group || args.group === command.group) &&
							(!args.command || args.command === command.name);
					});

				if (!toEject.length) {
					if (args.group && args.command) {
						throw Error(`command ${args.group}/${args.command} does not exist`);
					}
					console.log('no commands have implemented eject');
				}
				else {
					let performedEject = false;
					toEject.forEach(([ , command ]) => {
						if (command.eject) {
							command.eject(helper, handleNpmConfiguration, copyFiles);
							performedEject = true;
						}
						else if (args.group && args.command) {
							throw Error(`'eject' is not defined for command ${command.group}/${command.name}`);
						}
						else {
							console.warn(`${red('WARN')} 'eject' is not defined for ${command.group}/${command.name}, skipping...`);
						}
					});
					if (!performedEject) {
						console.log('no commands have implemented eject');
					}
				}
			});
		});
}

export default {
	name: '',
	group: 'eject',
	description: 'disconnect your project from dojo cli commands',
	register,
	run
};
