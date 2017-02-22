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
let mockDojoRc: any;
let configurationHelper: any;

const packagePath = join(pathResolve('.'), '/_build/tests/support');

registerSuite({
	name: 'Configuration Helper',
	'beforeEach'() {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/ConfigurationHelper');
		mockModule.dependencies([
			'pkg-dir',
			'fs-extra',
			'path',
			`${packagePath}/.dojorc`]);
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
		mockFs = mockModule.getMock('fs-extra');
		mockFs.existsSync = sinon.stub().returns(true);
		mockFs.readJsonSync = sinon.stub().returns({});
		mockFs.writeFileSync = sinon.stub();
		mockPath = mockModule.getMock('path');
		mockPath.join = sinon.stub().returns(`${packagePath}/.dojorc`);
		mockDojoRc = mockModule.getMock(`${packagePath}/.dojorc`);
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		configurationHelper = new moduleUnderTest();
	},
	'afterEach'() {
		sandbox.restore();
		mockModule.destroy();
	},
	'Should create .dojorc if it does not exist'() {
		mockFs.existsSync.returns(false);
		configurationHelper.get('testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce, '1');
		assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ testCommandName: {}}));
	},
	'Should write .dojorc with commandName if no config for that name already exists'() {
		mockFs.existsSync.returns(true);
		configurationHelper.get('testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce);
		assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ testCommandName: {}}));
	},
	'Should not write config to .dojorc when commandName exists'() {
		mockFs.readJsonSync = sinon.stub().returns({ testCommandName: {} });
		configurationHelper.get('testCommandName');
		assert.isTrue(mockFs.writeFileSync.notCalled);
	},
	'Should write new config to file when save called'() {
		const newConfig = { foo: 'bar' };
		mockFs.readJsonSync = sinon.stub().returns({ testCommandName: {} });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce);
		assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ testCommandName: newConfig }));
	},
	'Should merge new config with old when save called'() {
		const newConfig = { foo: 'bar' };
		const existingConfig = { existing: 'config' };
		mockFs.readJsonSync = sinon.stub().returns({ testCommandName: existingConfig });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce);
		assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ testCommandName: Object.assign(existingConfig, newConfig) }));
	},
	'Should merge new commandNames with existing command config when save called'() {
		const newConfig = { foo: 'bar' };
		const existingConfig = { existing: 'config' };
		mockFs.readJsonSync = sinon.stub().returns({ existingCommandName: existingConfig });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockFs.writeFileSync.calledOnce);
		assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({
			existingCommandName: existingConfig,
			testCommandName: newConfig
		}));
	}
});
