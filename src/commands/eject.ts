// import { CommandsMap } from '../command';
// import * as fs from 'fs';
import { Helper } from '../interfaces';
import { join } from 'path';
import { Yargs, Argv } from 'yargs';
import { yellow } from 'chalk';
import allCommands from '../allCommands';
const pkgDir = require('pkg-dir');

// TODO: define message templates
// const cannotFindCommand = '';
// const areYouSure = '';

const appPath = pkgDir.sync(process.cwd());

export interface EjectArgs extends Argv {
	group?: string;
	command?: string;
}

/**
 * Helper - add npm dependencies to package.jsonn
 * @param dependencies
 * @returns {void}
 */
function handleNpmDependencies(dependencies: string[]): void {

}

/**
 * Helper - copy files to current project root
 * @param files
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
		console.log('mkdir: ' + join(appPath, folder));
		// fs.mkdirSync(join(appPath, folder));
	});

	// copy over files to the current project
	console.log();
	console.log(yellow('Copying files into ' + appPath));
	files.forEach(function(file) {
		const newPath = file.replace(longestCommonPath, '');
		console.log('  Adding ' + yellow(file) + ' to the project');
		// if (fs.existsSync(join(appPath, newPath)) {
			// file already exists ERROR
		// }
		// var content = fs
		// 	.readFileSync(file, 'utf8')
			// // Remove dead code from .js files on eject
			// .replace(/\/\/ @remove-on-eject-begin([\s\S]*?)\/\/ @remove-on-eject-end/mg, '')
			// // Remove dead code from .applescript files on eject
			// .replace(/-- @remove-on-eject-begin([\s\S]*?)-- @remove-on-eject-end/mg, '')
		// 	.trim() + '\n';
		// fs.writeFileSync(join(appPath, newPath), content);
		console.log('writing file to: ' + join(appPath, newPath));
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
	// TODO: inspect args to see which groups/commands to eject.
	//       if no groups specified eject all commands
	//       if group but no command specified eject all commands under that group
	//       if group and command specified eject that command
	//       else throw error
	// TODO: if not error print warning
	// TODO: if warning accepted execute eject(s)
	return allCommands()
		.then((commands) => {
			const toEject = [ ...commands.commandsMap ]
				.filter(([ , command ]) => {
					return (!args.group || args.group === command.group) &&
						(!args.command || args.command === command.name);
				});

			copyFiles([
				'/user/a/b/c/d/e/script.js',
				'/user/a/b/c/script2.js',
				'/user/a/b/c/d/script.js'
			]);

			if (!toEject.length) {
				throw Error('nothing to do');
			}
			else {
				toEject.forEach(([ , command ]) => {
					if (command.eject) {
						command.eject(helper, handleNpmDependencies, copyFiles);
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
