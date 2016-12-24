import { existsSync } from 'fs';
import { copySync, mkdirsSync } from 'fs-extra';
import { join, resolve as pathResolve } from 'path';
import { Yargs, Argv } from 'yargs';
import { red, yellow, underline } from 'chalk';
import * as inquirer from 'inquirer';
import { Helper, NpmPackage } from '../interfaces';
import allCommands from '../allCommands';
import npmInstall from '../npmInstall';
const pkgDir = require('pkg-dir');

export interface EjectArgs extends Argv {
	group?: string;
	command?: string;
};

const appPath = pkgDir.sync(process.cwd());

/**
 * Helper - add npm configuration to package.jsonn
 * @param {NpmPackage} package
 * @returns {void}
 */
async function handleNpmConfiguration(pkg: NpmPackage): Promise<void> {
	const appPackage = require(join(appPath, 'package.json'));

	Object.keys(pkg.devDependencies || {}).forEach(function (dependency) {
		console.log(`	adding ${yellow(dependency)} to devDependencies`);
		appPackage.devDependencies = appPackage.devDependencies || {};
		if (appPackage.devDependencies[dependency]) {
			console.warn(`${red('WARN')}    devDependency ${dependency} already exists at version '${appPackage.devDependencies[dependency]}' and will be overwritten by version '${pkg.devDependencies[dependency]}'`);
		}
		appPackage.devDependencies[dependency] = pkg.devDependencies[dependency];
	});

	Object.keys(pkg.dependencies || {}).forEach(function (dependency) {
		console.log(`	adding ${yellow(dependency)} to dependencies`);
		appPackage.dependencies = appPackage.dependencies || {};
		if (appPackage.dependencies[dependency]) {
			console.warn(`${red('WARN')}    dependency ${dependency} already exists at version '${appPackage.dependencies[dependency]}' and will be overwritten by version '${pkg.dependencies[dependency]}'`);
		}
		appPackage.dependencies[dependency] = pkg.dependencies[dependency];
	});

	Object.keys(pkg.scripts || {}).forEach(function (script) {
		console.log(`	adding ${yellow(script)} to scripts`);
		appPackage.scripts = appPackage.scripts || {};
		if (appPackage.scripts[script]) {
			throw Error(`package script ${yellow(script)} already exists`);
		}
		appPackage.scripts[script] = pkg.scripts[script];
	});

	if (pkg.dependencies || pkg.devDependencies || pkg.scripts) {
		console.log(underline('running npm install...'));
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
	files.forEach(function(filePath) {
		const newPath = pathResolve(filePath).replace(longestCommonPath, '');
		if (existsSync(join(appPath, newPath))) {
			throw Error(`File already exists: ${join(appPath, newPath)}`);
		}
	});

	// create those folders within the current project
	folders.forEach((folder) => {
		console.log(`creating folder: ${yellow(join(appPath, folder))}`);
		mkdirsSync(join(appPath, folder));
	});

	// copy over files to the current project
	console.log(underline(`\n\ncopying files into current project at: ${yellow(appPath)}`));
	files.forEach(function(filePath) {
		const newPath = pathResolve(filePath).replace(longestCommonPath, '');
		console.log(`	copying ${yellow(pathResolve(filePath))} to the project which will now be located at: ${yellow(join(appPath, newPath))}`);
		copySync(filePath, join(appPath, newPath));
	});
}

function register(helper: Helper): Yargs {
	helper.yargs.option('g', {
		alias: 'group',
		describe: 'the group to eject commands from'
	});
	helper.yargs.option('c', {
		alias: 'command',
		describe: 'the command to eject - a `group` is required'
	});
	return helper.yargs;
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
					throw Error('nothing to do');
				}
				else {
					toEject.forEach(([ , command ]) => {
						if (command.eject) {
							command.eject(helper, handleNpmConfiguration, copyFiles);
						}
						else if (args.group && args.command) {
							throw Error(`'eject' is not defined for command ${command.group}/${command.name}`);
						}
						else {
							console.warn(`${red('WARN')} 'eject' is not defined for ${command.group}/${command.name}, skipping...`);
						}
					});
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
