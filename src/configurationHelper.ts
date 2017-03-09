import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigurationHelper, Config } from './interfaces';
const pkgDir = require('pkg-dir');

const appPath = pkgDir.sync(process.cwd());
let dojoRcPath: string;
if (appPath) {
	dojoRcPath = join(appPath, '.dojorc');
}

function writeConfigFile(config: Config) {
	writeFileSync(dojoRcPath, JSON.stringify(config, null, 2));
}

function getConfigFile(): Config {
	const configExists = !!dojoRcPath && existsSync(dojoRcPath);
	return configExists ? JSON.parse(readFileSync(dojoRcPath, 'utf8')) : {};
}

/**
 * persists configuration data to .dojorc
 *
 * @param config - the configuration to save
 * @param commandName - the command name that's accessing config
 */
export function save(config: Config, commandName: string): void {
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
export function get(commandName: string): Config {
	const config = getConfigFile();
	return config[commandName] || {};
};

const configHelper: ConfigurationHelper = {
	get,
	save
};

export default configHelper;
