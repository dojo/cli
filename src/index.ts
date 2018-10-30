import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import registerCommands from './registerCommands';
import { join } from 'path';
import commandLoader from './allCommands';
import installableCommands, { mergeInstalledCommandsWithAvailableCommands } from './installableCommands';
import { checkForMultiConfig } from './configurationHelper';
import LoggingHelper from './LoggingHelper';
const pkgDir = require('pkg-dir');

export async function init() {
	const loggingHelper = new LoggingHelper();

	try {
		const packagePath = pkgDir.sync(__dirname);
		const packageJsonFilePath = join(packagePath, 'package.json');
		const packageJson = <any>require(packageJsonFilePath);

		updateNotifier(packageJson);

		const availableCommands = await installableCommands(packageJson.name, loggingHelper);
		const allCommands = await commandLoader(loggingHelper);
		const mergedCommands = mergeInstalledCommandsWithAvailableCommands(
			allCommands,
			availableCommands,
			loggingHelper
		);

		registerCommands(yargs, loggingHelper, mergedCommands);
	} catch (err) {
		loggingHelper.error(`Commands are not available: ${err}`);
	}

	try {
		checkForMultiConfig(loggingHelper);
	} catch {}
}
