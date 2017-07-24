import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { resolve } from 'path';
import MockModule from '../support/MockModule';

const config = require('intern/dojo/node!./../../src/config').default;
const expectedSearchPrefixes = [ '@dojo/cli', 'dojo-cli' ];

registerSuite({
	name: 'config',
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
	},
	'explicit commands': (function() {
		let mockModule: any;
		let yargs: any;

		return {
			'beforeEach'() {
				mockModule = new MockModule('../../src/config');
				mockModule.dependencies(['yargs']);
				yargs = mockModule.getMock('yargs');
			},
			'afterEach'() {
				mockModule.destroy();
			},
			'no arguments'() {
				yargs.ctor.argv = undefined;
				const config = mockModule.getModuleUnderTest().default;
				assert.equal(config.explicitCommands.length, 0);
			},
			'arguments but not commands'() {
				yargs.ctor.argv = {'test': 1};
				const config = mockModule.getModuleUnderTest().default;
				assert.equal(config.explicitCommands.length, 0);
			},
			'single argument'() {
				yargs.ctor.argv = {command: 'one'};
				const config = mockModule.getModuleUnderTest().default;
				assert.deepEqual(config.explicitCommands, ['one']);
			},
			'multiple arguments'() {
				yargs.ctor.argv = {command: ['one', 'two']};
				const config = mockModule.getModuleUnderTest().default;
				assert.deepEqual(config.explicitCommands, ['one', 'two']);
			}
		};
	})()
});
