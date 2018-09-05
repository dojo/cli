const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { resolve as pathResolve } from 'path';
import * as sinon from 'sinon';
import MockModule from '../support/MockModule';

let sandbox: any;
let mockModule: MockModule;
let mockPkgDir: any;
let mockFs: any;
let mockPath: any;
let mockReadlineSync: any;
let moduleUnderTest: any;
let configurationHelper: any;
let consoleWarnStub: sinon.SinonStub;

const packagePath = pathResolve(__dirname, '../support');
const dojoRcPath = `${packagePath}/.dojorc`;
const packageJsonPath = `${packagePath}/package.json`;

registerSuite('Configuration Helper', {
	'package dir exists': {
		beforeEach() {
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../src/configurationHelper', require);
			mockModule.dependencies(['pkg-dir', 'fs', 'path', 'readline-sync', dojoRcPath, packageJsonPath]);
			mockPkgDir = mockModule.getMock('pkg-dir');
			mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
			mockFs = mockModule.getMock('fs');
			mockFs.existsSync = sinon.stub().returns(true);
			mockFs.readFileSync = sinon.stub().returns('{}');
			mockFs.writeFileSync = sinon.stub();
			mockPath = mockModule.getMock('path');
			mockPath.join = sinon.stub().returns(dojoRcPath);
			mockReadlineSync = mockModule.getMock('readline-sync');
			mockReadlineSync.isInKeyYN = sinon.stub().returns(true);
			moduleUnderTest = mockModule.getModuleUnderTest().default;
			configurationHelper = moduleUnderTest;
		},
		afterEach() {
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
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify({ 'testGroupName-testCommandName': newConfig }, null, 2)
				);
			},
			'Should write new config to file when save called without commandName'() {
				const newConfig = { foo: 'bar' };
				mockFs.readFileSync = sinon.stub().returns(JSON.stringify({ testGroupName: {} }));
				configurationHelper.sandbox('testGroupName').set(newConfig);

				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify({ testGroupName: newConfig }, null, 2)
				);
			},
			'Should merge new config with old when save called'() {
				const newConfig = { foo: 'bar' };
				const existingConfig = { existing: 'config' };
				mockFs.readFileSync.returns(JSON.stringify({ 'testGroupName-testCommandName': existingConfig }));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify(
						{ 'testGroupName-testCommandName': Object.assign(existingConfig, newConfig) },
						null,
						2
					)
				);
			},
			'Should write new config when one does not exist'() {
				mockFs.existsSync.returns(false);
				assert.isTrue(mockFs.readFileSync.notCalled);

				const newConfig = { foo: 'bar' };
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);

				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify({ 'testGroupName-testCommandName': newConfig }, null, 2)
				);
			},
			'Should merge new commandNames with existing command config when save called'() {
				const newConfig = { foo: 'bar' };
				const existingConfig = { existing: 'config' };
				mockFs.readFileSync.returns(JSON.stringify({ existingCommandName: existingConfig }));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.deepEqual(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify(
						{
							existingCommandName: existingConfig,
							'testGroupName-testCommandName': newConfig
						},
						null,
						2
					)
				);
			},
			'Should return undefined command config when no dojorc config for command exists'() {
				mockFs.existsSync.returns(false);
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isTrue(mockFs.readFileSync.calledOnce);
				assert.equal(config, undefined);
			},
			'Should return existing config when a dojorc entry exists'() {
				const existingConfig = { existing: 'config' };
				mockFs.readFileSync.returns(JSON.stringify({ 'testGroupName-testCommandName': existingConfig }));
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isTrue(mockFs.readFileSync.calledTwice);
				assert.deepEqual(config, existingConfig);
			},
			'Should accept and ignore commandName parameter'() {
				const newConfig = { foo: 'bar' };
				mockFs.readFileSync = sinon.stub().returns(JSON.stringify({ 'testGroupName-testCommandName': {} }));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig, 'invalid name');

				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify({ 'testGroupName-testCommandName': newConfig }, null, 2)
				);
			},
			'Should throw an error when the config is not valid JSON'() {
				mockFs.readFileSync = sinon.stub();
				mockFs.readFileSync.onCall(0).returns('{}');
				mockFs.readFileSync.onCall(1).returns('{]');
				const test = () => configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.throws(test, Error, /^Invalid \.dojorc: /);
			}
		}
	},
	'package dir does not exist': {
		beforeEach() {
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../src/configurationHelper', require);
			mockModule.dependencies(['pkg-dir', 'fs', 'path']);
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
		afterEach() {
			sandbox.restore();
			mockModule.destroy();
		},

		tests: {
			'Should return undefined config when pkgdir returns null'() {
				mockFs.readFileSync = sinon.stub();
				mockFs.readFileSync.onCall(0).returns('{}');
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isFalse(mockPath.join.called);
				assert.equal(config, undefined);
			},
			'Should warn user when config save called outside of a pkgdir'() {
				configurationHelper.sandbox('testGroupName', 'testCommandName').set({});
				assert.isFalse(mockFs.writeFileSync.called);
				assert.isTrue(consoleWarnStub.calledOnce);
			}
		}
	},

	'package json': {
		beforeEach() {
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../src/configurationHelper', require);
			mockModule.dependencies(['pkg-dir', 'fs', 'path', 'readline-sync', dojoRcPath]);
			mockPkgDir = mockModule.getMock('pkg-dir');
			mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
			mockFs = mockModule.getMock('fs');
			mockFs.existsSync = sinon.stub().callsFake((filename) => filename === packageJsonPath);
			mockFs.readFileSync = sinon.stub().returns(
				JSON.stringify({
					dojo: {
						test: {
							hello: 'world'
						},
						'testGroupName-testCommandName': {
							one: 'two'
						}
					}
				})
			);
			mockFs.writeFileSync = sinon.stub();
			mockPath = mockModule.getMock('path');
			mockPath.join = sinon
				.stub()
				.callsFake((...args) => (args.some((a) => a === 'package.json') ? packageJsonPath : dojoRcPath));
			mockReadlineSync = mockModule.getMock('readline-sync');
			mockReadlineSync.keyInYN = sinon.stub().returns(true);
			moduleUnderTest = mockModule.getModuleUnderTest().default;
			configurationHelper = moduleUnderTest;
		},
		afterEach() {
			sandbox.restore();
			mockModule.destroy();
		},
		tests: {
			'reads config from package.json if available'() {
				assert.deepEqual(configurationHelper.sandbox('testGroupName', 'testCommandName').get(), {
					one: 'two'
				});

				assert.deepEqual(configurationHelper.sandbox('testGroupName', 'testCommandName').get('test'), {
					hello: 'world'
				});
			},

			'confirms writing config to package.json'() {
				configurationHelper.sandbox('testGroupName', 'testCommandName').set({
					hello: 'world'
				});

				assert.isTrue(mockReadlineSync.keyInYN.called);

				configurationHelper.sandbox('testGroupName', 'testCommandName').set({
					hello: 'world'
				});

				assert.isTrue(mockReadlineSync.keyInYN.calledOnce);

				assert.isTrue(mockFs.writeFileSync.calledTwice);
			},

			'does not write to package.json if no answered'() {
				mockReadlineSync.keyInYN = sinon.stub().returns(false);

				configurationHelper.sandbox('testGroupName', 'testCommandName').set({
					hello: 'world'
				});

				assert.isFalse(mockFs.writeFileSync.called);
			}
		}
	}
});
