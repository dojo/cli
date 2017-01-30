import { existsSync, writeFile } from 'fs';
import { join } from 'path';
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
		return this.get().then((dojoRc = {}) => {
			dojoRc[packageName] = {
				...(dojoRc[packageName] || {}),
				...config
			};
			return new Promise((resolve, reject) => {
				writeFile(join(appPath, '.dojorc'), JSON.stringify(dojoRc), { flag: 'wr' }, (error: Error) => {
					if (error) {
						reject(error);
						return;
					}
					resolve();
				});
			});
		});
	};

	/**
	 * Retrieves the configuration object from the file system 
	 * or undefined if configuration does not exist
	 * 
	 * @returns Promise - an object representation of .dojorc
	 */
	async get(): Promise<any> {
		const path = join(appPath, '.dojorc');
		return new Promise((resolve, reject) => {
			if (existsSync(path)) {
				resolve(require(path));
			}
			resolve();
		});
	};
};
