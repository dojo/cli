import chalk from 'chalk';
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

export function getConfigFile(): Config | undefined {
	const configExists = !!dojoRcPath && existsSync(dojoRcPath);
	if (configExists) {
		try {
			return JSON.parse(readFileSync(dojoRcPath, 'utf8'));
		} catch (error) {
			throw new Error(`Invalid .dojorc: ${error}`);
		}
	}
	return undefined;
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
	 * @returns an object representation of .dojorc
	 */
	get(): Config;
	/**
	 * Retrieves the configurationFactory object from the file system
	 *
	 * @param commandName - the command name that's accessing config
	 * @returns an object representation of .dojorc
	 */
	get(commandName: string): Config;
	get(commandName?: string): Config {
		const config = getConfigFile() || {};
		return config[this._configurationKey] || {};
	}

	/**
	 * persists configurationFactory data to .dojorc
	 *
	 * @param config - the configurationFactory to save
	 */
	set(config: Config): void;
	/**
	 * @deprecated
	 *
	 * persists configurationFactory data to .dojorc
	 *
	 * @param config - the configurationFactory to save
	 * @param commandName - the command name that's accessing config
	 */
	set(config: Config, commandName: string): void;
	set(config: Config, commandName?: string): void {
		if (!dojoRcPath) {
			console.warn(chalk.red('You cannot save a config outside of a project directory'));
			return;
		}

		const dojoRc = getConfigFile() || {};
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
