import { resolve } from 'path';

export default {
	searchPaths: [
		resolve(__dirname, '../node_modules'),
		resolve(__dirname, '../../'),
		'node_modules'
	],
	searchPrefixes: ['dojo-cli']
};
