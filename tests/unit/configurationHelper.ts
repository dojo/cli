const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { resolve as pathResolve } from 'path';
import MockModule from '../support/MockModule';
import * as sinon from 'sinon';

let sandbox: any;
let mockModule: MockModule;
let mockPkgDir: any;
let mockFs: any;
let mockPath: any;
let moduleUnderTest: any;
let configurationHelper: any;
let consoleWarnStub: sinon.SinonStub;

const packagePath = pathResolve(__dirname, '../support');
const dojoRcPath = `${packagePath}/.dojorc`;

registerSuite('Configuration Helper', {
	'package dir exists': {
		'beforeEach'() {
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../src/configurationHelper', require);
			mockModule.dependencies([
				'pkg-dir',
				'fs',
				'path',
				dojoRcPath
			]);
			mockPkgDir = mockModule.getMock('pkg-dir');
			mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
			mockFs = mockModule.getMock('fs');
			mockFs.existsSync = sinon.stub().returns(true);
			mockFs.readFileSync = sinon.stub().returns('{}');
			mockFs.writeFileSync = sinon.stub();
			mockPath = mockModule.getMock('path');
			mockPath.join = sinon.stub().returns(dojoRcPath);
			moduleUnderTest = mockModule.getModuleUnderTest().default;
			configurationHelper = moduleUnderTest;
		},
		'afterEach'() {
			sandbox.restore();
			mockModule.destroy();
		},

		tests: {
			'Should write new config to file when save called'() {
				const newConfig = { foo: 'bar' };
				mockFs.readFileSync = sinon.stub().returns(JSON.stringify({ 'testGroupName-testCommandName': {} }));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);

				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ 'testGroupName-testCommandName': newConfig }, null, 2));
			},
			'Should merge new config with old when save called'() {
				const newConfig = { foo: 'bar' };
				const existingConfig = { existing: 'config' };
				mockFs.readFileSync.returns(JSON.stringify({ 'testGroupName-testCommandName': existingConfig }));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ 'testGroupName-testCommandName': Object.assign(existingConfig, newConfig) }, null, 2));
			},
			'Should merge new commandNames with existing command config when save called'() {
				const newConfig = { foo: 'bar' };
				const existingConfig = { existing: 'config' };
				mockFs.readFileSync.returns(JSON.stringify({ existingCommandName: existingConfig }));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.deepEqual(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({
					existingCommandName: existingConfig,
					'testGroupName-testCommandName': newConfig
				}, null, 2));
			},
			'Should return undefined config when no dojorc for commandName exists'() {
				mockFs.existsSync.returns(false);
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isTrue(mockFs.readFileSync.notCalled);
				assert.deepEqual(config, {});
			},
			'Should return existing config when a dojorc entry exists'() {
				const existingConfig = { existing: 'config' };
				mockFs.readFileSync.returns(JSON.stringify({ 'testGroupName-testCommandName': existingConfig }));
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isTrue(mockFs.readFileSync.calledOnce);
				assert.deepEqual(config, existingConfig);
			},
			'Should accept and ignore commandName parameter'() {
				const newConfig = { foo: 'bar' };
				mockFs.readFileSync = sinon.stub().returns(JSON.stringify({ 'testGroupName-testCommandName': {} }));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig, 'invalid name');

				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.equal(mockFs.writeFileSync.firstCall.args[1], JSON.stringify({ 'testGroupName-testCommandName': newConfig }, null, 2));
			}
		}
	},
	'package dir does not exist': {
		'beforeEach'() {
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../src/configurationHelper', require);
			mockModule.dependencies([
				'pkg-dir',
				'fs',
				'path'
			]);
			mockPkgDir = mockModule.getMock('pkg-dir');
			mockPkgDir.ctor.sync = sandbox.stub().returns(null);
			mockFs = mockModule.getMock('fs');
			mockFs.readFileSync = sandbox.stub();
			mockFs.writeFileSync = sandbox.stub();
			mockPath = mockModule.getMock('path');
			mockPath.join = sandbox.stub();
			consoleWarnStub = sandbox.stub(console, 'warn');
			moduleUnderTest = mockModule.getModuleUnderTest().default;
			configurationHelper = moduleUnderTest;
		},
		'afterEach'() {
			sandbox.restore();
			mockModule.destroy();
		},

		tests: {
			'Should return empty object when pkgdir returns null'() {
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isFalse(mockFs.readFileSync.called);
				assert.isFalse(mockPath.join.called);
				assert.deepEqual(config, {});
			},
			'Should warn user when config save called outside of a pkgdir'() {
				configurationHelper.sandbox('testGroupName', 'testCommandName').set({});
				assert.isFalse(mockFs.writeFileSync.called);
				assert.isTrue(consoleWarnStub.calledOnce);
			}
		}
	}
});
