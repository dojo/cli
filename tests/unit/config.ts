import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { resolve } from 'path';

const config = require('intern/dojo/node!./../../src/config').default;
const expectedSearchPrefix = 'dojo-cli';

registerSuite({
	name: 'config',
	'Should provide a search prefix'() {
		const prefix = config.searchPrefix;
		assert.isTrue(typeof prefix === 'string');
		assert.equal(expectedSearchPrefix, prefix);
	},
	'Should provide three search paths'() {
		const paths = config.searchPaths;
		assert.equal(3, paths.length);
	},
	'Should look in current working directory node_modules first'() {
		const paths = config.searchPaths;
		assert.equal(paths[0], 'node_modules');
	},
	'Should look in global peer packages second'() {
		const paths = config.searchPaths;
		assert.equal(paths[1], resolve('..'));
	},
	'Should look in the global package node_modules last'() {
		const paths = config.searchPaths;
		const expectedPath = resolve('node_modules');
		assert.equal(paths[2], expectedPath);
	}
});
