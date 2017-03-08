import { copySync } from 'fs-extra';
import { resolve } from 'path';
import { Argv } from 'yargs';
import { green, underline, yellow } from 'chalk';
import * as inquirer from 'inquirer';
import { Helper, NpmPackage, OptionsHelper, EjectOutput, FileCopyConfig } from '../interfaces';
import { CommandWrapper } from '../command';
import { loadExternalCommands } from '../allCommands';
import { deepAssign } from '@dojo/core/lang';
import { installDependencies, installDevDependencies } from '../npmInstall';

const copiedFilesDir = 'config';
const ejectedKey = 'ejected';

export interface EjectArgs extends Argv {
	group?: string;
	command?: string;
};

export interface EjectableCommandWrapper extends CommandWrapper {
	eject(helper: Helper): EjectOutput;
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

function copyFiles(commandName: string, { path, files }: FileCopyConfig): void {
	const cwd = process.cwd();
	if (path && files && files.length > 0) {
		files.forEach((fileName) => {
			const sourcePath = resolve(path, fileName);
			const destPath = resolve(cwd, copiedFilesDir, commandName, fileName);

			console.log(` ${yellow('creating')} ${destPath.replace(cwd, '.')}`);
			copySync(sourcePath, destPath);
		});
	}
}

async function run(helper: Helper, args: EjectArgs): Promise<any> {
	return inquirer.prompt({
		type: 'confirm',
		name: 'eject',
		message: 'Are you sure you want to eject (this is a permanent operation)?',
		default: false
	}).then((answer: { eject: boolean }) => {
		if (!answer.eject) {
			throw Error('Aborting eject');
		}
		return loadExternalCommands()
			.then(async (commands) => {
				const npmPackages: NpmPackage = {
					dependencies: {},
					devDependencies: {}
				};

				const toEject = [ ...commands.commandsMap.values() ].reduce((toEject: CommandWrapper[], command) => {
					const isSpecifiedGroup = !args.group || args.group === command.group;
					const isSpecifiedCommand = !args.command || args.command === command.name;
					const isNewCommand = toEject.indexOf(command) < 0;

					if (command.eject && isNewCommand && isSpecifiedGroup && isSpecifiedCommand) {
						toEject.push(command);
					}

					return toEject;
				}, []);

				if (toEject.length) {
					const allHints: string[] = [];
					toEject.forEach((command: EjectableCommandWrapper) => {
						const commandKey = `${command.group}-${command.name}`;
						console.log(green('\nejecting ') + commandKey);

						const { npm = {}, copy, hints }: EjectOutput = command.eject(helper);

						deepAssign(npmPackages, npm);
						copy && copyFiles(commandKey, copy);
						hints && allHints.push(...hints);
						helper.configuration.save({ [ejectedKey]: true }, commandKey);
					});

					if (Object.keys(npmPackages.dependencies).length) {
						console.log(underline('\nrunning npm install dependencies...'));
						await installDependencies(npmPackages);
					}

					if (Object.keys(npmPackages.devDependencies).length) {
						console.log(underline('\nrunning npm install devDependencies...'));
						await installDevDependencies(npmPackages);
					}

					if (allHints.length > 0) {
						console.log(underline('\nhints'));
						allHints.forEach((hint) => {
							console.log(' ' + hint);
						});
					}
				}
				else if (args.group && args.command) {
					throw Error(`command ${args.group}-${args.command} does not implement eject`);
				}
				else {
					console.log('There are no commands that can be ejected');
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
