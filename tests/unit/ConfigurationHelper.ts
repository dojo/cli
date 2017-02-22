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
let mockJsonFile: any;
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
			'fs',
			'jsonfile',
			'path',
			dojoRcPath
		]);
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
		mockFs = mockModule.getMock('fs');
		mockFs.existsSync = sinon.stub().returns(true);
		mockJsonFile = mockModule.getMock('jsonfile');
		mockJsonFile.readFileSync = sinon.stub().returns({});
		mockJsonFile.writeFileSync = sinon.stub();
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
		mockJsonFile.readFileSync = sinon.stub().returns({ testCommandName: {} });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockJsonFile.writeFileSync.calledOnce);
		assert.equal(mockJsonFile.writeFileSync.firstCall.args[0], dojoRcPath);
		assert.deepEqual(mockJsonFile.writeFileSync.firstCall.args[1], { testCommandName: newConfig });
	},
	'Should merge new config with old when save called'() {
		const newConfig = { foo: 'bar' };
		const existingConfig = { existing: 'config' };
		mockJsonFile.readFileSync.returns({ testCommandName: existingConfig });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockJsonFile.writeFileSync.calledOnce);
		assert.deepEqual(mockJsonFile.writeFileSync.firstCall.args[1], { testCommandName: Object.assign(existingConfig, newConfig) });
	},
	'Should merge new commandNames with existing command config when save called'() {
		const newConfig = { foo: 'bar' };
		const existingConfig = { existing: 'config' };
		mockJsonFile.readFileSync.returns({ existingCommandName: existingConfig });
		configurationHelper.save(newConfig, 'testCommandName');
		assert.isTrue(mockJsonFile.writeFileSync.calledOnce);
		assert.deepEqual(mockJsonFile.writeFileSync.firstCall.args[1], {
			existingCommandName: existingConfig,
			testCommandName: newConfig
		});
	},
	'Should return undefined config when no dojorc for commandName exists'() {
		mockFs.existsSync.returns(false);
		const config = configurationHelper.get('testCommandName');
		assert.isTrue(mockJsonFile.readFileSync.notCalled);
		assert.isUndefined(config);
	},
	'Should return existing config when a dojorc entry exists'() {
		const existingConfig = { existing: 'config' };
		mockJsonFile.readFileSync.returns({ testCommandName: existingConfig });
		const config = configurationHelper.get('testCommandName');
		assert.isTrue(mockJsonFile.readFileSync.calledOnce);
		assert.deepEqual(config, existingConfig);
	}
});
