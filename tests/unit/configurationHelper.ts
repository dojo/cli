const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { resolve as pathResolve } from 'path';
import * as sinon from 'sinon';
import MockModule from '../support/MockModule';
import chalk from 'chalk';

let sandbox: any;
let mockModule: MockModule;
let mockPkgDir: any;
let mockFs: any;
let mockPath: any;
let mockReadlineSync: any;
let moduleUnderTest: any;
let configurationHelper: any;
let consoleErrorStub: sinon.SinonStub;
let consoleWarnStub: sinon.SinonStub;
let configToIndent: any;
let mockcheckForMultiConfig: any;

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
			consoleWarnStub = sandbox.stub(console, 'warn');
			consoleErrorStub = sandbox.stub(console, 'error');
		},
		afterEach() {
			sandbox.restore();
			mockModule.destroy();
		},

		tests: {
			'Should write new config to file when save called'() {
				const newConfig = { foo: 'bar' };
				const config = { 'testGroupName-testCommandName': {} };
				mockFs.readFileSync = sinon.stub().returns(JSON.stringify(config));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(consoleWarnStub.notCalled);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify({ 'testGroupName-testCommandName': newConfig }, null, 2)
				);
			},
			'Should write new config to file when save called without commandName'() {
				const newConfig = { foo: 'bar' };
				const config = { testGroupName: {} };
				mockFs.readFileSync = sinon.stub().returns(JSON.stringify(config));
				configurationHelper.sandbox('testGroupName').set(newConfig);
				assert.isTrue(consoleWarnStub.notCalled);
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
				const mergedConfigs = Object.assign(existingConfig, newConfig);
				const config = { 'testGroupName-testCommandName': existingConfig };
				mockFs.readFileSync.returns(JSON.stringify(config));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(consoleErrorStub.notCalled);
				assert.isTrue(consoleWarnStub.notCalled);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify({ 'testGroupName-testCommandName': mergedConfigs }, null, 2)
				);
			},
			'Should write new config to .dojorc path when one does not exist'() {
				mockFs.existsSync.returns(false);
				assert.isTrue(mockFs.readFileSync.notCalled);

				const newConfig = { foo: 'bar' };
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(consoleErrorStub.notCalled);
				assert.isTrue(consoleWarnStub.notCalled);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify({ 'testGroupName-testCommandName': newConfig }, null, 2)
				);
			},
			'Should merge new commandNames with existing command config to .dojorc when set called'() {
				const newConfig = { foo: 'bar' };
				const existingConfig = { existing: 'config' };
				const config = { existingCommandName: existingConfig };
				mockFs.readFileSync.returns(JSON.stringify(config));
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(consoleErrorStub.notCalled);
				assert.isTrue(consoleWarnStub.notCalled);
				assert.isTrue(mockFs.writeFileSync.calledOnce);
				assert.equal(mockFs.writeFileSync.firstCall.args[0], dojoRcPath);
				assert.deepEqual(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify(
						{
							existingCommandName: existingConfig,
							'testGroupName-testCommandName': newConfig
						},
						null,
						'  '
					)
				);
			},
			'Should write .dojorc with current .dojorc identation of 4 spaces'() {
				const newConfig = { foo: 'bar' };
				const existingConfig = { existing: 'config' };
				const config = { existingCommandName: existingConfig };
				mockFs.readFileSync.onCall(0).returns(JSON.stringify(config, null, '    '));
				mockFs.readFileSync.onCall(1).returns(JSON.stringify(config, null, '    '));
				mockFs.readFileSync.onCall(2).returns('{}');
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(consoleWarnStub.notCalled);
				assert.isTrue(consoleErrorStub.notCalled);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify(
						{
							existingCommandName: existingConfig,
							'testGroupName-testCommandName': newConfig
						},
						null,
						'    '
					)
				);
			},
			'Should write .dojorc with current .dojorc identation of 2 spaces'() {
				const newConfig = { foo: 'bar' };
				const existingConfig = { existing: 'config' };
				const config = { existingCommandName: existingConfig };

				mockFs.readFileSync.onCall(0).returns(JSON.stringify(config, null, '  '));
				mockFs.readFileSync.onCall(1).returns(JSON.stringify(config, null, '  '));
				mockFs.readFileSync.onCall(2).returns('{}');
				configurationHelper.sandbox('testGroupName', 'testCommandName').set(newConfig);
				assert.isTrue(consoleWarnStub.notCalled);
				assert.isTrue(consoleErrorStub.notCalled);
				assert.equal(
					mockFs.writeFileSync.firstCall.args[1],
					JSON.stringify(
						{
							existingCommandName: existingConfig,
							'testGroupName-testCommandName': newConfig
						},
						null,
						'  '
					)
				);
			},
			'Should return undefined command config when no dojorc config for command exists'() {
				mockFs.existsSync.returns(false);
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isTrue(mockFs.readFileSync.notCalled);
				assert.equal(config, undefined);
			},
			'Should return existing config when a dojorc entry exists'() {
				const existingConfig = { existing: 'config' };
				mockFs.existsSync.onCall(0).returns(true);
				mockFs.existsSync.onCall(1).returns(false);
				const readConfig = { 'testGroupName-testCommandName': existingConfig };
				mockFs.readFileSync.onCall(0).returns(JSON.stringify(readConfig));
				mockFs.readFileSync.onCall(1).returns(JSON.stringify(readConfig));
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.isTrue(mockFs.readFileSync.calledTwice);
				assert.equal(mockFs.readFileSync.firstCall.args[0], dojoRcPath);
				assert.deepEqual(config, existingConfig);
			},
			'Should shallow extend configs correctly'() {
				mockFs.existsSync.onCall(0).returns(true);
				mockFs.existsSync.onCall(1).returns(false);
				mockFs.readFileSync.onCall(0).returns(
					JSON.stringify({
						extends: './path/to/dojorc/to/.extend',
						'testGroupName-testCommandName': {
							prop: 'config'
						}
					})
				);
				mockFs.readFileSync.onCall(1).returns(
					JSON.stringify({
						extends: './path/to/dojorc/to/.extend',
						'testGroupName-testCommandName': {
							prop: 'config'
						}
					})
				);
				mockFs.readFileSync.onCall(2).returns(
					JSON.stringify({
						'testGroupName-testCommandName': {
							prop: 'config-extended'
						}
					})
				);
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.equal(mockFs.readFileSync.callCount, 3);
				assert.equal(mockFs.readFileSync.firstCall.args[0], dojoRcPath);
				assert.deepEqual(config, {
					prop: 'config'
				});
			},
			'Supports deep extension of configs correctly'() {
				mockFs.existsSync.onCall(0).returns(true);
				mockFs.existsSync.onCall(1).returns(false);
				mockFs.readFileSync.onCall(0).returns(
					JSON.stringify({
						extends: './path/to/dojorc/to/.extend',
						'testGroupName-testCommandName': {
							prop: 'config'
						}
					})
				);
				mockFs.readFileSync.onCall(1).returns(
					JSON.stringify({
						extends: './path/to/dojorc/to/.extend',
						'testGroupName-testCommandName': {
							prop: 'config'
						}
					})
				);
				mockFs.readFileSync.onCall(2).returns(
					JSON.stringify({
						extends: './path/to/dojorc/to/.extend1',
						'testGroupName-testCommandName': {
							prop: 'config-extended-1',
							prop1: 'config-extended-1',
							prop3: {
								innerProp: 'config-inner-prop',
								innerProp1: {
									deepProp: 'config-deep-prop',
									deepProp1: 'config-deep-prop'
								}
							}
						}
					})
				);
				mockFs.readFileSync.onCall(3).returns(
					JSON.stringify({
						'testGroupName-testCommandName': {
							prop: 'config-extended-2',
							prop2: 'config-extended-2',
							prop3: {
								innerProp: 'config-inner-prop-1',
								innerProp1: {
									deepProp: 'config-deep-prop'
								}
							}
						}
					})
				);
				const config = configurationHelper.sandbox('testGroupName', 'testCommandName').get();
				assert.equal(mockFs.readFileSync.callCount, 4);
				assert.equal(mockFs.readFileSync.firstCall.args[0], dojoRcPath);
				assert.deepEqual(config, {
					prop: 'config',
					prop1: 'config-extended-1',
					prop2: 'config-extended-2',
					prop3: {
						innerProp: 'config-inner-prop',
						innerProp1: {
							deepProp: 'config-deep-prop',
							deepProp1: 'config-deep-prop'
						}
					}
				});
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
				mockFs.existsSync.returns(true);
				mockFs.readFileSync = sinon.stub();
				mockFs.readFileSync.onCall(0).returns('{}');
				mockFs.readFileSync.onCall(1).returns('{}');
				mockFs.readFileSync.onCall(2).returns('{]');
				mockFs.readFileSync.onCall(3).returns('{]');
				const test = () => configurationHelper.sandbox('testGroupName', 'testCommandName').get();

				assert.throws(
					test,
					Error,
					chalk.red(
						`Could not parse the package.json file to get config: SyntaxError: Unexpected token ] in JSON at position 1`
					)
				);
				assert.equal(mockFs.readFileSync.callCount, 4, 'both package.json and .dojorc should be read');
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
			consoleErrorStub = sandbox.stub(console, 'error');
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
				assert.isTrue(consoleErrorStub.calledOnce);
			}
		}
	},

	'package json': {
		beforeEach() {
			configToIndent = {
				dojo: {
					test: {
						hello: 'world'
					},
					'testGroupName-testCommandName': {
						one: 'two',
						hello: 'world'
					}
				}
			};
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../src/configurationHelper', require);
			mockModule.dependencies(['pkg-dir', 'fs', 'path', 'readline-sync', dojoRcPath]);
			mockPkgDir = mockModule.getMock('pkg-dir');
			mockPkgDir.ctor.sync = sandbox.stub().returns(packagePath);
			mockFs = mockModule.getMock('fs');
			mockFs.existsSync = sinon.stub().callsFake((filename) => filename === packageJsonPath);
			mockFs.readFileSync = sinon.stub().returns(
				JSON.stringify(
					{
						dojo: {
							test: {
								hello: 'world'
							},
							'testGroupName-testCommandName': {
								one: 'two'
							}
						}
					},
					null,
					'    '
				)
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

				assert.isTrue(mockReadlineSync.keyInYN.called, 'yes/no is called');

				configurationHelper.sandbox('testGroupName', 'testCommandName').set({
					hello: 'world'
				});

				assert.isTrue(mockReadlineSync.keyInYN.calledOnce, 'yes/no is only called once');

				assert.isTrue(mockFs.writeFileSync.calledTwice, 'the file is written twice');
			},

			'writes package.json with current package.json identation of 4 spaces'() {
				configurationHelper.sandbox('testGroupName', 'testCommandName').set({
					hello: 'world'
				});
				const indentFour = '    ';
				const indentedConfig = JSON.stringify(configToIndent, null, indentFour);

				assert.equal(mockFs.writeFileSync.firstCall.args[1], indentedConfig);
			},

			'writes package.json with current package.json identation of 2 spaces'() {
				const indentTwo = '  ';
				const indentedConfig = JSON.stringify(configToIndent, null, indentTwo);
				mockFs.readFileSync = sinon.stub().returns(indentedConfig);

				configurationHelper.sandbox('testGroupName', 'testCommandName').set({
					hello: 'world'
				});

				assert.equal(mockFs.writeFileSync.firstCall.args[1], indentedConfig);
			},

			'does not write to package.json if no answered'() {
				mockReadlineSync.keyInYN = sinon.stub().returns(false);

				configurationHelper.sandbox('testGroupName', 'testCommandName').set({
					hello: 'world'
				});

				assert.isFalse(mockFs.writeFileSync.called);
			}
		}
	},

	checkForMultiConfig: {
		beforeEach() {
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../src/configurationHelper', require);
			mockModule.dependencies(['pkg-dir', 'fs', 'path']);
			mockPkgDir = mockModule.getMock('pkg-dir');
			mockPkgDir.ctor.sync = sandbox.stub().returns(null);
			mockFs = mockModule.getMock('fs');

			mockFs.existsSync = sandbox.stub().returns(true);
			mockFs.readFileSync = sandbox.stub();
			mockFs.readFileSync.onCall(0).returns('{}');
			mockFs.readFileSync.onCall(1).returns('{}');
			mockFs.readFileSync.onCall(2).returns('{ "dojo": {} }');
			mockFs.readFileSync.onCall(3).returns('{ "dojo": {} }');
			mockPath = mockModule.getMock('path');
			mockPath.join = sandbox.stub();
			consoleWarnStub = sandbox.stub(console, 'warn');
			mockcheckForMultiConfig = mockModule.getModuleUnderTest().checkForMultiConfig;
			configurationHelper = moduleUnderTest;
		},
		afterEach() {
			sandbox.restore();
			mockModule.destroy();
		},

		tests: {
			'should warn about having multi configs'() {
				mockcheckForMultiConfig();
				assert.equal(mockFs.existsSync.callCount, 2);
				assert.equal(mockFs.readFileSync.callCount, 4);
				assert.equal(consoleWarnStub.callCount, 1);
				assert.equal(
					consoleWarnStub.firstCall.args[0],
					chalk.yellow(
						`Warning: Both a .dojorc configuration and a dojo configuration in your package.json were found. The .dojorc file will take precedent. It is recommended you stick to one configuration option.`
					)
				);
			}
		}
	}
});
