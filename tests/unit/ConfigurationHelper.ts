import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import MockModule from '../support/MockModule';
import { join, resolve as pathResolve } from 'path';
const sap = require('sinon-as-promised');
const sinon = new sap(Promise);

let sandbox: any;
let mockModule: MockModule;
let mockPkgDir: any;
let mockFs: any;
let mockPath: any;
let moduleUnderTest: any;
let configurationHelper: any;

const packagePath = join(pathResolve('.'), '/_build/tests/support');
const dojoRcPath = `${packagePath}/.dojorc`;

registerSuite({
	name: 'Configuration Helper',
	'beforeEach'() {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/ConfigurationHelper');
		mockModule.dependencies([
			'pkg-dir',
			'fs-extra',
			'path',
			dojoRcPath
		]);
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
		mockFs = mockModule.getMock('fs-extra');
		mockFs.existsSync = sinon.stub().returns(true);
		mockFs.readJsonSync = sinon.stub().returns({});
		mockFs.writeFileSync = sinon.stub();
		mockPath = mockModule.getMock('path');
		mockPath.join = sinon.stub().returns(dojoRcPath);
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		configurationHelper = new moduleUnderTest();
	},
	'afterEach'() {
		sandbox.restore();
		mockModule.destroy();
	},
	'Should write new config to file when save called'() {
		const newConfig = { foo: 'bar' };
		mockFs.readJsonSync = sinon.stub().returns({ testCommandName: {} });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce);
		assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
		assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ testCommandName: newConfig }, null, 2));
	},
	'Should merge new config with old when save called'() {
		const newConfig = { foo: 'bar' };
		const existingConfig = { existing: 'config' };
		mockFs.readJsonSync.returns({ testCommandName: existingConfig });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce);
		assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ testCommandName: Object.assign(existingConfig, newConfig) }, null, 2));
	},
	'Should merge new commandNames with existing command config when save called'() {
		const newConfig = { foo: 'bar' };
		const existingConfig = { existing: 'config' };
		mockFs.readJsonSync.returns({ existingCommandName: existingConfig });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce);
		assert.deepEqual(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({
			existingCommandName: existingConfig,
			testCommandName: newConfig
		}, null, 2));
	},
	'Should return undefined config when no dojorc for commandName exists'() {
		mockFs.existsSync.returns(false);
		const config = configurationHelper.get('testCommandName');
		assert.isTrue(mockFs.readJsonSync.notCalled);
		assert.deepEqual(config, {});
	},
	'Should return existing config when a dojorc entry exists'() {
		const existingConfig = { existing: 'config' };
		mockFs.readJsonSync.returns({ testCommandName: existingConfig });
		const config = configurationHelper.get('testCommandName');
		assert.isTrue(mockFs.readJsonSync.calledOnce);
		assert.deepEqual(config, existingConfig);
	}
});
