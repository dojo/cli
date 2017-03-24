import { red } from 'chalk';
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

class SingleCommandConfigurationHelper implements ConfigurationHelper {
	private _configurationKey: string;

	constructor(groupName: string, commandName?: string) {
		this._configurationKey = groupName;

		if (commandName) {
			this._configurationKey += `-${commandName}`;
		}
	}

	/**
	 * Retrieves the configurationFactory object from the file system
	 *
	 * @returns Promise - an object representation of .dojorc
	 */
	get(): Config {
		const config = getConfigFile();
		return config[this._configurationKey] || {};
	}

	/**
	 * persists configurationFactory data to .dojorc
	 *
	 * @param config - the configurationFactory to save
	 * @param commandName - the command name that's accessing config
	 */
	set(config: Config): void {
		if (!dojoRcPath) {
			console.warn(red('You cannot save a config outside of a project directory'));
			return;
		}

		const dojoRc = getConfigFile();
		const commmandConfig: Config = dojoRc[this._configurationKey] || {};

		Object.assign(commmandConfig, config);
		Object.assign(dojoRc, { [this._configurationKey]: commmandConfig });

		writeConfigFile(dojoRc);
	}
}

export class ConfigurationHelperFactory {
	sandbox(groupName: string, commandName?: string): ConfigurationHelper {
		return new SingleCommandConfigurationHelper(groupName, commandName);
	}
}

export default new ConfigurationHelperFactory();
