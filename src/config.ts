import { join } from 'path';

const pkgDir = require('pkg-dir');
const packagePath = pkgDir.sync(__dirname);
const yargs = require('yargs');

export type Config = {
	searchPaths: string[],
	searchPrefixes: string[],
	builtInCommandLocation: string,
	explicitCommands: string[]
};

const explicitCommands: string[] = (yargs.argv && yargs.argv.command) ? [ ... Array.isArray(yargs.argv.command) ? yargs.argv.command : [ yargs.argv.command ] ] : [];

export default {
	searchPaths: [
		'node_modules',
		join(__dirname, '..', '..'),
		join(packagePath, 'node_modules')
	],
	searchPrefixes: [ '@dojo/cli', 'dojo-cli' ],
	builtInCommandLocation: join(__dirname, '/commands'),  // better to be relative to this file (like an import) than link to publish structure
	explicitCommands
} as Config;
