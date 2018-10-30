import { copySync } from 'fs-extra';
import { basename, isAbsolute, resolve } from 'path';
import { Argv } from 'yargs';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import {
	CommandWrapper,
	Helper,
	NpmPackage,
	OptionsHelper,
	EjectOutput,
	FileCopyConfig,
	LoggingHelper
} from '../interfaces';
import { loadExternalCommands } from '../allCommands';
import { installDependencies, installDevDependencies } from '../npmInstall';
import configurationHelper from '../configurationHelper';

const { green, underline, yellow } = chalk;
const copiedFilesDir = 'config';
const ejectedKey = 'ejected';

export interface EjectArgs extends Argv {}

export interface EjectableCommandWrapper extends CommandWrapper {
	eject(helper: Helper): EjectOutput;
}

function isEjectableCommandWrapper(object: CommandWrapper): object is EjectableCommandWrapper {
	return typeof object.eject === 'function';
}

function register(options: OptionsHelper): void {}

function copyFiles(commandName: string, { path, files }: FileCopyConfig, logging: LoggingHelper): void {
	const cwd = process.cwd();
	if (path && files && files.length > 0) {
		files.forEach((fileName) => {
			const sourcePath = isAbsolute(fileName) ? fileName : resolve(path, fileName);
			const destFileName = isAbsolute(fileName) ? basename(fileName) : fileName;
			const destPath = resolve(cwd, copiedFilesDir, commandName, destFileName);

			logging.log(` ${yellow('creating')} ${destPath.replace(cwd, '.')}`);
			copySync(sourcePath, destPath);
		});
	}
}

async function run(helper: Helper, args: EjectArgs): Promise<any> {
	return inquirer
		.prompt({
			type: 'confirm',
			name: 'eject',
			message: 'Are you sure you want to eject (this is a permanent operation)?',
			default: false
		})
		.then((answer) => {
			if (!answer.eject) {
				throw Error('Aborting eject');
			}
			return loadExternalCommands(helper.logging).then(async (commands) => {
				let toEject = new Set<EjectableCommandWrapper>();
				commands.forEach((commandMap, group) => {
					toEject = [...commandMap.values()].reduce((toEject, command) => {
						if (isEjectableCommandWrapper(command)) {
							toEject.add(command);
						}
						return toEject;
					}, toEject);
				});
				const npmPackages: NpmPackage = {
					dependencies: {},
					devDependencies: {}
				};

				if (toEject.size) {
					const allHints: string[] = [];
					[...toEject].forEach((command) => {
						const commandKey = `${command.group}-${command.name}`;
						helper.logging.log(green('\nejecting ') + commandKey);

						const { npm = {}, copy = false, hints = false } = command.eject(helper);

						npmPackages.dependencies = { ...npmPackages.dependencies, ...npm.dependencies };
						npmPackages.devDependencies = { ...npmPackages.devDependencies, ...npm.devDependencies };
						copy && copyFiles(commandKey, copy, helper.logging);
						hints && allHints.push(...hints);
						configurationHelper
							.sandbox(helper.logging, command.group, command.name)
							.set({ [ejectedKey]: true });
					});

					if (Object.keys(npmPackages.dependencies || {}).length) {
						helper.logging.log(underline('\nrunning npm install dependencies...'));
						await installDependencies(npmPackages);
					}

					if (Object.keys(npmPackages.devDependencies || {}).length) {
						helper.logging.log(underline('\nrunning npm install devDependencies...'));
						await installDevDependencies(npmPackages);
					}

					if (allHints.length > 0) {
						helper.logging.log(underline('\nhints'));
						allHints.forEach((hint) => {
							helper.logging.log(' ' + hint);
						});
					}
				} else {
					helper.logging.log('There are no commands that can be ejected');
				}
			});
		});
}

export default {
	name: '',
	group: 'eject',
	description: 'disconnect your project from dojo cli commands',
	register,
	global: false,
	run
};
