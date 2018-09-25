import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import registerCommands from './registerCommands';
import { join } from 'path';
import commandLoader from './allCommands';
import installableCommands, { mergeInstalledCommandsWithAvailableCommands } from './installableCommands';
import { checkForMultiConfig } from './configurationHelper';
const pkgDir = require('pkg-dir');

export async function init() {
	try {
		const packagePath = pkgDir.sync(__dirname);
		const packageJsonFilePath = join(packagePath, 'package.json');
		const packageJson = <any>require(packageJsonFilePath);

		updateNotifier(packageJson);

		const availableCommands = await installableCommands(packageJson.name);
		const allCommands = await commandLoader();
		const mergedCommands = mergeInstalledCommandsWithAvailableCommands(allCommands, availableCommands);

		registerCommands(yargs, mergedCommands);
	} catch (err) {
		console.log(`Commands are not available: ${err}`);
	}

	try {
		checkForMultiConfig();
	} catch {}
}
