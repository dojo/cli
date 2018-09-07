import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Config, ConfigurationHelper, ConfigWrapper } from './interfaces';
import * as readlineSync from 'readline-sync';
import * as detectIndent from 'detect-indent';

const pkgDir = require('pkg-dir');

const appPath = pkgDir.sync(process.cwd());
let dojoRcPath: string;
let packageJsonPath: string;
if (appPath) {
	dojoRcPath = join(appPath, '.dojorc');
	packageJsonPath = join(appPath, 'package.json');
}

let canWriteToPackageJson: boolean | undefined;
const defaultIndent = 2;

function parseConfigs(): ConfigWrapper {
	const configWrapper: ConfigWrapper = {};

	if (existsSync(dojoRcPath)) {
		try {
			const dojoRcFile = readFileSync(dojoRcPath, 'utf8');
			configWrapper.dojoRcIndent = detectIndent(dojoRcFile).indent;
			configWrapper.dojoRcConfig = JSON.parse(dojoRcFile);
		} catch (error) {
			throw Error(chalk.red(`Could not parse the .dojorc  file to get config : ${error}`));
		}
	}

	if (existsSync(packageJsonPath)) {
		try {
			const packageJsonFile = readFileSync(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(packageJsonFile);
			configWrapper.packageJsonIndent = detectIndent(packageJsonFile).indent;
			configWrapper.packageJsonConfig = packageJson.dojo;
		} catch (error) {
			throw Error(chalk.red(`Could not parse the package.json file to get config: ${error}`));
		}
	}

	return configWrapper;
}

function writePackageConfig(config: Config, indent: string | number) {
	if (canWriteToPackageJson === undefined) {
		canWriteToPackageJson = Boolean(
			readlineSync.keyInYN(
				'You are using a "dojo" configuration in your package.json. Saving the current settings will update your package.json. Continue? [ (N)o / (Y)es ]: ',
				{ guide: false }
			)
		);
	}

	if (canWriteToPackageJson) {
		const packageJsonFile = readFileSync(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonFile);
		packageJson.dojo = config;
		const newPackageJson = JSON.stringify(packageJson, null, indent);
		writeFileSync(packageJsonPath, newPackageJson);
	}
}

function writeDojoRcConfig(config: Config, indent: string | number) {
	const json = JSON.stringify(config, null, indent);
	writeFileSync(dojoRcPath, json);
}

export function getConfig(): Config | undefined {
	const { packageJsonConfig, dojoRcConfig } = parseConfigs();
	const { hasDojoRcConfig, hasPackageConfig } = checkForMultiConfig(dojoRcConfig, packageJsonConfig);
	if (!hasDojoRcConfig && hasPackageConfig) {
		return packageJsonConfig;
	} else {
		return dojoRcConfig;
	}
}

function checkForMultiConfig(dojoRcConfig: Config | undefined, packageJsonConfig: Config | undefined) {
	const hasPackageConfig = typeof packageJsonConfig === 'object';
	const hasDojoRcConfig = typeof dojoRcConfig === 'object';

	if (hasPackageConfig && hasDojoRcConfig) {
		console.warn(
			chalk.yellow(
				`Warning: Both a .dojorc configuration and a dojo configuration in your package.json were found. The .dojorc file will take precedent. It is recommended you stick to one configuration option.`
			)
		);
	}

	return {
		hasPackageConfig,
		hasDojoRcConfig
	};
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
		if (!dojoRcPath && !packageJsonPath) {
			console.error(chalk.red('You cannot save a config outside of a project directory'));
			return;
		}

		const { packageJsonConfig, packageJsonIndent, dojoRcConfig, dojoRcIndent } = parseConfigs();
		const { hasDojoRcConfig, hasPackageConfig } = checkForMultiConfig(dojoRcConfig, packageJsonConfig);

		const updateConfig = dojoRcConfig || packageJsonConfig || {};

		const commmandConfig: Config = updateConfig[this._configurationKey] || {};

		Object.assign(commmandConfig, config);
		Object.assign(updateConfig, { [this._configurationKey]: commmandConfig });

		if (!hasDojoRcConfig && hasPackageConfig) {
			writePackageConfig(updateConfig, packageJsonIndent || defaultIndent);
		} else {
			writeDojoRcConfig(updateConfig, dojoRcIndent || defaultIndent);
		}
	}
}

export class ConfigurationHelperFactory {
	sandbox(groupName: string, commandName?: string): ConfigurationHelper {
		return new SingleCommandConfigurationHelper(groupName, commandName);
	}
}

export default new ConfigurationHelperFactory();
