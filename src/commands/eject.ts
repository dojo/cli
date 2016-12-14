import * as fs from 'fs';
import { Helper, NpmPackage } from '../interfaces';
import { join } from 'path';
import { Yargs, Argv } from 'yargs';
import { yellow } from 'chalk';
import allCommands from '../allCommands';
const spawnSync = require('cross-spawn');
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
function handleNpmConfiguration(pkg: NpmPackage): void {
	const appPackage = require(join(appPath, 'package.json'));

	Object.keys(pkg.devDependencies).forEach(function (dependency) {
		console.log(`->->adding ${yellow(dependency)} to devDependencies`);
		appPackage.devDependencies[dependency] = pkg.devDependencies[dependency];
	});

	Object.keys(pkg.dependencies).forEach(function (dependency) {
		console.log(`->->adding ${yellow(dependency)} to dependencies`);
		appPackage.dependencies[dependency] = pkg.dependencies[dependency];
	});

	Object.keys(pkg.scripts).forEach(function (script) {
		console.log(`->->adding ${yellow(script)} to scripts`);
		if (appPackage.scripts[script]) {
			throw Error(`package script ${yellow(script)} already exists`);
		}
		appPackage.scripts[script] = pkg.scripts[script];
	});

	console.log(yellow('running npm install...'));
	spawnSync('npm', ['install'], { stdio: 'inherit' });
}

/**
 * Helper - copy files to current project root
 * @param {string[]} files - an array of fully-qualified file paths
 * @returns {void}
 */
function copyFiles(files: string[]): void {
	const map: { [name: string]: number } = {};

	// collect a map of the partial paths and their usage counts 
	files.forEach((filePath: string) => {
		const parts: string[] = filePath.split('/');
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
	let longestCommonPath = Object.keys(map).reduce((previous, current) => {
		if (map[current] === files.length) {
			return previous.length > current.length ? previous : current;
		}
		return previous;
	}, '');

	// collect only the unique non-fully-qualified folder paths
	const folders: string[] = [];
	files.forEach((filePath: string) => {
		filePath = filePath.replace(longestCommonPath, '');
		const parts = filePath.split('/');
		parts.pop();
		if (parts.length) {
			folders.push(join(...parts));
		}
	});

	// create those paths in the current project
	folders.forEach((folder) => {
		console.log(`creating folder: ${join(appPath, folder)}`);
		fs.mkdirSync(join(appPath, folder));
	});

	// copy over files to the current project
	console.log(yellow(`copying files into current project at: ${appPath}`));
	files.forEach(function(file) {
		const newPath = file.replace(longestCommonPath, '');
		console.log(`->->copying ${yellow(file)} to the project which will now be located at: ${join(appPath, newPath)}`);
		if (fs.existsSync(join(appPath, newPath))) {
			throw Error(`File already exists: ${join(appPath, newPath)}`);
		}
		const content = fs.readFileSync(file, 'utf8').trim() + '\n';
		fs.writeFileSync(join(appPath, newPath), content);
	});
}

function register(helper: Helper): Yargs {
	helper.yargs.option('g', {
		alias: 'group',
		describe: 'group'
	});
	helper.yargs.option('c', {
		alias: 'command',
		describe: 'command - a `group` is required'
	});
	return helper.yargs;
}

function run(helper: Helper, args: EjectArgs): Promise<any> {
	// TODO: add in prompt
	return allCommands()
		.then((commands) => {
			const toEject = [ ...commands.commandsMap ]
				.filter(([ , command ]) => {
					return (!args.group || args.group === command.group) &&
						(!args.command || args.command === command.name);
				});

			if (!toEject.length) {
				throw Error('nothing to do');
			}
			else {
				toEject.forEach(([ , command ]) => {
					if (command.eject) {
						command.eject(helper, handleNpmConfiguration, copyFiles);
					}
					else {
						throw Error(`'eject' not defined for command ${command.group}/${command.name}`);
					}
				});
			}
		});
}

export default {
	name: '',
	group: 'eject',
	description: 'disconnect your project from dojo cli commands',
	register,
	run
};
