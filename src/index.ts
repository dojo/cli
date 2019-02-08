import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import registerCommands from './registerCommands';
import { join } from 'path';
import loadAllCommands from './allCommands';
import installableCommands, { mergeInstalledCommandsWithAvailableCommands } from './installableCommands';
import { checkForMultiConfig } from './configurationHelper';
const pkgDir = require('pkg-dir');

export async function init() {
	try {
		const start = new Date();
		const packagePath = pkgDir.sync(__dirname);
		const packageJsonFilePath = join(packagePath, 'package.json');
		const packageJson = <any>require(packageJsonFilePath);

		const [availableCommands, allCommands] = await Promise.all([
			installableCommands(packageJson.name),
			loadAllCommands()
		]);

		const mergedCommands = mergeInstalledCommandsWithAvailableCommands(allCommands, availableCommands);

		registerCommands(yargs, mergedCommands);
		updateNotifier(packageJson);

		const end = new Date();
		console.log('time in ms', end.getTime() - start.getTime());
	} catch (err) {
		console.log(`Commands are not available: ${err}`);
	}

	try {
		checkForMultiConfig();
	} catch {}
}
