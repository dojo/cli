import { resolve } from 'path';

export type Config = {
	searchPaths: string[],
	searchPrefix: string
};

export default <Config> {
	searchPaths: [
		resolve(__dirname, '../../node_modules'),
		resolve(__dirname, '../../'),
		'node_modules'
	],
	searchPrefix: 'dojo-cli'
};
