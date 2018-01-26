const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { resolve } from 'path';

import config from '../../src/config';
const expectedSearchPrefixes = ['@dojo/cli', 'dojo-cli'];

registerSuite('config', {
	'Should provide a search prefix'() {
		const prefix = config.searchPrefixes;
		assert.isTrue(Array.isArray(prefix));
		assert.deepEqual(expectedSearchPrefixes, prefix);
	},
	'Should provide three search paths'() {
		const paths = config.searchPaths;
		assert.equal(3, paths.length);
	},
	'Should look in current working directory node_modules first'() {
		const paths = config.searchPaths;
		assert.equal(paths[0], 'node_modules');
	},
	'Should look in peer packages second'() {
		const paths = config.searchPaths;
		const expectedPath = resolve('.');
		assert.equal(paths[1], expectedPath);
	},
	'Should look in packages node_modules last'() {
		const paths = config.searchPaths;
		const expectedPath = resolve('node_modules');
		assert.equal(paths[2], expectedPath);
	}
});
