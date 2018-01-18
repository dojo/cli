import { join } from 'path';
const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(__dirname);
import { CliConfig } from './interfaces';

export default {
	searchPaths: [
		'node_modules',
		join(__dirname, '..', '..'),
		join(packagePath, 'node_modules')
	],
	searchPrefixes: [ '@dojo/cli', 'dojo-cli' ],
	builtInCommandLocation: join(__dirname, '/commands')  // better to be relative to this file (like an import) than link to publish structure
} as CliConfig;
