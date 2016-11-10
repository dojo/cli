import { join } from 'path';
import dirname from './dirname';
const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);

export type Config = {
	searchPaths: string[],
	searchPrefix: string
};

export default <Config> {
	searchPaths: [
		join(packagePath, 'node_modules'),
		join(packagePath, '..'),
		'node_modules',
	],
	searchPrefix: 'dojo-cli'
};
