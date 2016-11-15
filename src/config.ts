import { join } from 'path';

const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(__dirname);

export type Config = {
	searchPaths: string[],
	searchPrefix: string
};

export default <Config> {
	searchPaths: [
		join(packagePath, 'node_modules'),
		join(packagePath, '..'),
		'node_modules'
	],
	searchPrefix: 'dojo-cli'
};
