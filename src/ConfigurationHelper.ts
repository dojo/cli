import { existsSync } from 'fs';
const { readFileSync, writeFileSync } = require('jsonfile');
import { join } from 'path';
import { ConfigurationHelper, Config } from './interfaces';
const pkgDir = require('pkg-dir');

const appPath = pkgDir.sync(process.cwd());
const dojoRcPath = join(appPath, '.dojorc');

function writeConfigFile(config: Config) {
	writeFileSync(dojoRcPath, config, { spaces: 2 });
}

function getConfigFile(commandName?: string): Config {
	const configExists = existsSync(dojoRcPath);
	const config: Config = configExists ? readFileSync(dojoRcPath) : {};

	return commandName ? config[commandName] : config;
}

/**
 * ConfigurationHelper class which is passed into each command's run function
 * allowing commands to persist and retrieve .dojorc config object
 */
export default class implements ConfigurationHelper {
	/**
	 * persists configuration data to .dojorc
	 *
	 * @param config - the configuration to save
	 * @param commandName - the command name that's accessing config
	 */
	save(config: Config, commandName: string): void {
		const dojoRc = getConfigFile();
		const commmandConfig: Config = dojoRc[commandName] || {};

		Object.assign(commmandConfig, config);
		Object.assign(dojoRc, { [commandName]: commmandConfig});

		writeConfigFile(dojoRc);
	};

	/**
	 * Retrieves the configuration object from the file system
	 *
	 * @returns Promise - an object representation of .dojorc
	 */
	get(commandName: string): Config {
		return getConfigFile(commandName) || {};
	};
};
