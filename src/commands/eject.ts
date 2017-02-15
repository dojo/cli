// import { writeFileSync } from 'fs';
// import { copySync, ensureDirSync } from 'fs-extra';
// import { join } from 'path';
import { Argv } from 'yargs';
import { green, underline } from 'chalk';
// import * as inquirer from 'inquirer';
import { Helper, NpmPackage, OptionsHelper, EjectOutput } from '../interfaces';
import allCommands from '../allCommands';
import { deepAssign } from '@dojo/core/lang';
import { installDependencies, installDevDependencies } from '../npmInstall';

const builtInCommands = [ 'eject/', 'version/' ];

export interface EjectArgs extends Argv {
	group?: string;
	command?: string;
};

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

async function run(helper: Helper, args: EjectArgs): Promise<any> {
	// return inquirer.prompt({
	// 	type: 'confirm',
	// 	name: 'eject',
	// 	message: 'Are you sure you want to eject (this is a permanent operation)?',
	// 	default: false
	// }).then((answer: { eject: boolean }) => {
	// 	if (!answer.eject) {
	// 		throw Error('Aborting eject');
	// 	}
		return allCommands()
			.then(async (commands) => {

				const npmPackages: NpmPackage = {
					dependencies: {},
					devDependencies: {}
				};

				const filesToCopy: string[] = [];

				// Filter out `version` and `eject` commands, ignore duplicates and grab
				// only the commands specified via arguments to be ejected.
				const commandSet = new Set<string>(builtInCommands);

				const toEject = [ ...commands.commandsMap ]
					.filter(([ , command ]) => {
						const key = `${command.group}/${command.name}`;
						const exists = commandSet.has(key);
						commandSet.add(key);
						return !exists && (!args.group || args.group === command.group) &&
							(!args.command || args.command === command.name);
					});

				let commandsToEject = false;

				if (toEject.length) {
					toEject.forEach(([ , command ]) => {
						if (command.eject) {
							console.log(green('ejecting ') + `${command.group}-${command.name}`);
							const { npm = {}, files = [] }: EjectOutput = command.eject(helper);

							deepAssign(npmPackages, npm);
							filesToCopy.push(...files);

							commandsToEject = true;
						}
						else if (args.group && args.command) {
							throw Error(`'eject' is not defined for command ${command.group}-${command.name}`);
						}
					});
				}
				else if (args.group && args.command) {
					throw Error(`command ${args.group}-${args.command} does not exist`);
				}

				if (commandsToEject) {
					if (Object.keys(npmPackages.dependencies).length) {
						console.log(underline('running npm install dependencies...'));
						await installDependencies(npmPackages);
					}

					if (Object.keys(npmPackages.devDependencies).length) {
						console.log(underline('running npm install devDependencies...'));
						await installDevDependencies(npmPackages);
					}
				}
				else {
					console.log('There are no commands to eject');
				}
			});
		// });
}

export default {
	name: '',
	group: 'eject',
	description: 'disconnect your project from dojo cli commands',
	register,
	run
};
