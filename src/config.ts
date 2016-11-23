import { join } from 'path';
const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(__dirname);

export type Config = {
	searchPaths: string[],
	searchPrefix: string,
	builtInCommandLocation: string
};

export default <Config> {
	searchPaths: [
		'node_modules',
		join(packagePath, '..'),
		join(packagePath, 'node_modules')
	],
	searchPrefix: 'dojo-cli',
	builtInCommandLocation: join(__dirname, '/commands')  // better to be relative to this file (like an import) than link to publish structure
};
