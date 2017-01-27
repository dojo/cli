import { existsSync, writeFile } from 'fs';
import { join } from 'path';
import { red } from 'chalk';
import { ConfigurationHelper } from './interfaces';
const pkgDir = require('pkg-dir');
const packageName = pkgDir.sync(__dirname).split('/').pop();

const appPath = pkgDir.sync(process.cwd());

/**
 * ConfigurationHelper class which is passed into each command's run function
 * allowing commands to persist and retrieve .dojorc config object
 */
export default class implements ConfigurationHelper {
	/**
	 * persists configuration data to .dojorc
	 * checks for collisions
	 * 
	 * @param config - the configuration to save
	 * @returns Promise - this an indicator of success/failure
	 */
	async save(config: any = {}): Promise<any> {
		const dojoRc = this.get() || {};
		const section = dojoRc[packageName] = dojoRc[packageName] || {};
		Object.keys(config).forEach((key) => {
			if (key in section) {
				throw Error(`${red('ERROR')} .dojorc#${packageName} already contains a '${key}' property`);
			}
			section[key] = config[key];
		});
		return new Promise((resolve, reject) => {
			writeFile(join(appPath, '.dojorc'), JSON.stringify(dojoRc), { flag: 'wr' }, (error: Error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	};

	/**
	 * Retrieves the configuration object from the file system 
	 * or undefined if configuration does not exist
	 * 
	 * @returns an object representation of .dojorc
	 */
	get() {
		const path = join(appPath, '.dojorc');
		if (existsSync(path)) {
			return require(path);
		}
	}
};
