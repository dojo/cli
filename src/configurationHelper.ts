import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Config, ConfigurationHelper } from './interfaces';
import * as readlineSync from 'readline-sync';

const pkgDir = require('pkg-dir');

const appPath = pkgDir.sync(process.cwd());
let dojoRcPath: string;
let packageJsonPath: string;
if (appPath) {
	dojoRcPath = join(appPath, '.dojorc');
	packageJsonPath = join(appPath, 'package.json');
}

function readPackageConfig() {
	const { dojo } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
	return dojo;
}

let canWriteToPackageJson: boolean | undefined;

function writePackageConfig(config: Config) {
	if (canWriteToPackageJson === undefined) {
		canWriteToPackageJson = Boolean(
			readlineSync.keyInYN(
				'You are using a "dojo" configuration in your package.json. Saving the current settings will update your package.json. Continue? [ (N)o / (Y)OLO ]: ',
				{ guide: false }
			)
		);
	}

	if (canWriteToPackageJson) {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

		packageJson.dojo = config;

		writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
	}
}

function writeConfigFile(config: Config) {
	writeFileSync(dojoRcPath, JSON.stringify(config, null, 2));
}

function dojoRcExists() {
	return !!dojoRcPath && existsSync(dojoRcPath);
}

export function getConfigFile(): Config | undefined {
	const configExists = dojoRcExists();
	if (configExists) {
		try {
			return JSON.parse(readFileSync(dojoRcPath, 'utf8'));
		} catch (error) {
			throw new Error(`Invalid .dojorc: ${error}`);
		}
	}
	return undefined;
}

function getConfig(): Config | undefined {
	const packageConfig = readPackageConfig();
	if (!dojoRcExists() && typeof packageConfig === 'object') {
		return packageConfig;
	} else {
		return getConfigFile();
	}
}

function writeConfig(config: Config) {
	const packageConfig = readPackageConfig();
	if (!dojoRcExists() && typeof packageConfig === 'object') {
		writePackageConfig(config);
	} else {
		writeConfigFile(config);
	}
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
	get(commandName: string = this._configurationKey): Config {
		const config = getConfig() || {};
		return config[commandName];
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

		writeConfig(dojoRc);
	}
}

export class ConfigurationHelperFactory {
	sandbox(groupName: string, commandName?: string): ConfigurationHelper {
		return new SingleCommandConfigurationHelper(groupName, commandName);
	}
}

export default new ConfigurationHelperFactory();
