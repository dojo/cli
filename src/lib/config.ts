import { resolve } from 'path';

export type Config = {
	searchPaths: string[],
	searchPrefixes: string[]
};

export default <Config> {
	searchPaths: [
		resolve(__dirname, '../node_modules'),
		resolve(__dirname, '../../'),
		'node_modules'
	],
	searchPrefixes: ['dojo-cli']
};
