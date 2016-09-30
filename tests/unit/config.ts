import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import { SinonStub, stub } from 'sinon';
import { join } from 'path';

const fakePackageRoot = 'fakePackageRoot';
const fakeGlobalModuleRoot = 'fakeGlobalModuleRoot';
const expectedSearchPrefix = 'dojo-cli';
const pkgDirStub: SinonStub = stub().returns(join(fakeGlobalModuleRoot, fakePackageRoot));
let config: any;

registerSuite({
	name: 'config',
	'setup'() {
		mockery.enable({
			warnOnUnregistered: false
		});

		mockery.registerMock('./dirname', { 'default': fakePackageRoot });
		mockery.registerMock('pkg-dir', { 'sync': pkgDirStub });

		config = require('intern/dojo/node!./../../src/config').default;
	},
	'beforeEach'() {
		pkgDirStub.reset();
	},
	'teardown'() {
		mockery.deregisterAll();
		mockery.disable();
	},
	'Should provide a search prefix'() {
		const prefix = config.searchPrefix;
		assert.isTrue(typeof prefix === 'string');
		assert.equal(expectedSearchPrefix, prefix);
	},
	'Should provide three search paths'() {
		const paths = config.searchPaths;
		assert.equal(3, paths.length);
	},
	'Should look in the global package node_modules first'() {
		const paths = config.searchPaths;
		const expectedPath = join(fakeGlobalModuleRoot, fakePackageRoot, 'node_modules');
		assert.equal(paths[0], expectedPath);
	},
	'Should look in global peer packages second'() {
		const paths = config.searchPaths;
		assert.equal(paths[1], fakeGlobalModuleRoot);
		assert.equal(-1, paths[1].indexOf(fakePackageRoot));
	},
	'Should look in current working directory node_modules last'() {
		const paths = config.searchPaths;
		assert.equal(paths[2], 'node_modules');
	}
});
