import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import registerCommands from './registerCommands';
import { join } from 'path';
import commandLoader from './allCommands';
import installableCommands, { mergeInstalledCommandsWithAvailableCommands } from './installableCommands';
import { existsSync } from 'fs';
import chalk from 'chalk';
const pkgDir = require('pkg-dir');

export async function init() {
	const packagePath = pkgDir.sync(__dirname);
	const packageJsonFilePath = join(packagePath, 'package.json');
	const packageJson = <any>require(packageJsonFilePath);

	try {
		updateNotifier(packageJson);

		const availableCommands = await installableCommands(packageJson.name);
		const allCommands = await commandLoader();
		const mergedCommands = mergeInstalledCommandsWithAvailableCommands(allCommands, availableCommands);

		registerCommands(yargs, mergedCommands);
	} catch (err) {
		console.error(chalk.red(`Commands are not available: ${err}`));
		return;
	}

	const pwdPackageJsonexists = existsSync(join(process.cwd(), 'package.json'));
	if (!pwdPackageJsonexists) {
		console.warn(
			chalk.yellow(
				'Warning: a package.json file was not found and is expected for many Dojo CLI commands. You can initialise one by running'
			),
			chalk.yellow.bold('npm init'),
			`\n`
		);
	}
}
