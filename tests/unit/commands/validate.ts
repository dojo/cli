const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert, expect } = intern.getPlugin('chai');

import chalk from 'chalk';
import { join, resolve as pathResolve } from 'path';
import * as sinon from 'sinon';
import {
	getValidationErrors,
	getConfigPath,
	ValidateableCommandWrapper,
	isValidateableCommandWrapper,
	VALIDATION_FILENAME,
	validateCommand
} from '../../../src/commands/validate';

import { CommandMap, CommandWrapper } from '../../../src/interfaces';
import MockModule from '../../support/MockModule';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';

const { green, red } = chalk;

describe('validate', () => {
	const validatePackagePath = join(pathResolve(__dirname), '../../support/validate');
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockAllExternalCommands: any;
	let sandbox: sinon.SinonSandbox;
	let mockConfigurationHelper: any;
	let mockValidate: any;
	let consoleLogStub: any;
	// let validateCommand: any;

	const validateableCommandWrapper: ValidateableCommandWrapper = {
		name: 'test',
		description: 'test command',
		group: 'testgroup',
		path: 'tests/support/validate/',
		global: false,
		installed: true,
		default: false,
		validate: () => {},
		register: () => {},
		run: () => {
			return Promise.resolve();
		}
	};

	const noneValidateableCommandWrapper: CommandWrapper = {
		name: 'test',
		description: 'test command',
		group: 'testgroup',
		path: 'tests/support/validate/',
		global: false,
		installed: true,
		default: false,
		register: () => {},
		run: () => {
			return Promise.resolve();
		}
	};

	function getHelper(config?: any) {
		const basicHelper = {
			command: 'validate',
			configuration: {
				get: sandbox.stub().returns({}),
				set: sandbox.stub()
			}
		};

		return Object.assign({}, basicHelper, config);
	}

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../../src/commands/validate', require);
		mockModule.dependencies([
			'../allCommands',
			'path',
			`${validatePackagePath}/package.json`,
			'../configurationHelper'
		]);
		mockAllExternalCommands = mockModule.getMock('../allCommands');
		mockConfigurationHelper = mockModule.getMock('../configurationHelper');
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		consoleLogStub = sandbox.stub(console, 'log');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	describe('function', () => {
		describe('isValidateableCommandWrapper', () => {
			expect(isValidateableCommandWrapper(validateableCommandWrapper)).to.be.true;
			expect(isValidateableCommandWrapper(noneValidateableCommandWrapper)).to.be.false;
		});

		describe('getConfigPath', () => {
			const result = getConfigPath(validateableCommandWrapper);
			expect(result).to.equal(validateableCommandWrapper.path + VALIDATION_FILENAME);
		});

		describe('getValidationErrors', () => {
			it(`should return no errors if all object criteria are met`, () => {
				assert(getValidationErrors !== undefined);
				expect(getValidationErrors).to.not.be.undefined;
				const mockSchema = {
					type: 'object',
					properties: {
						command: {
							type: 'string'
						}
					},
					required: ['command']
				};
				const errors = getValidationErrors({ command: 'foo' }, mockSchema);
				expect(errors).to.be.lengthOf(0);
			});

			it(`errenous nested properties in configs behave as expected`, () => {
				assert(getValidationErrors !== undefined);
				expect(getValidationErrors).to.not.be.undefined;
				const mockSchema = {
					type: 'object',
					properties: {
						foo: {
							enum: ['baz', 'bar'],
							type: 'object',
							required: ['bar'],
							properties: {
								bar: {
									enum: ['baz', 'bar'],
									type: 'string'
								}
							}
						}
					},
					required: ['foo']
				};
				const config = {
					foo: {
						bar: 'foo'
					}
				};
				const errors = getValidationErrors(config, mockSchema);
				expect(errors).to.be.lengthOf(2);
			});
		});

		describe('validateCommand', () => {
			it(`should fail on validating a command with mismatching config and schema`, () => {
				expect(validateCommand).to.not.be.undefined;
				const config = {
					foo: {
						bar: 'foo'
					}
				};
				const valid = validateCommand(validateableCommandWrapper, config, false);
				expect(valid).to.be.false;
			});

			it(`should pass on validating a valid command`, () => {
				expect(validateCommand).to.not.be.undefined;
				const config = {
					foo: {
						bar: 'foobar'
					}
				};

				const valid = validateCommand(validateableCommandWrapper, config, false);
				expect(valid).to.be.true;
			});
		});
	});

	describe('run command', () => {
		it(`should never call validation logic with no config`, () => {
			mockConfigurationHelper.getConfigFile = sandbox.stub().returns({});
			mockValidate = mockModule.getModuleUnderTest();
			mockValidate.validate = sandbox.stub().returns([]);

			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: true
			});

			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);

			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.isTrue(mockConfigurationHelper.getConfigFile.called);
					assert.isFalse(mockValidate.validate.called);
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'no config route should be taken which should be error free');
				}
			);
		});

		it(`should not call against commands that have no schema`, () => {
			mockModule.getMock('path').join = sandbox.stub().returns('./noneExistantPath.json');
			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: true
			});

			mockConfigurationHelper.getConfigFile = sandbox.stub().returns({
				foo: 'bar'
			});

			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);

			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.fail(null, null, 'without a valid schema the test should fail');
				},
				(error: { message: string }) => {}
			);
		});

		it(`should throw an error because a corrupt schema is provided`, () => {
			mockModule.getMock('path').join = sandbox.stub().returns('tests/support/validate/corruptSchema.json');
			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: true
			});

			mockConfigurationHelper.getConfigFile = sandbox.stub().returns({
				foo: 'bar'
			});

			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);

			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.fail(null, null, 'moduleUnderTest.run should reject because schema is corrupt.');
				},
				(error: { message: string }) => {
					// Ensure not erroring because it can't find the path
					expect(error.message.includes('Schema file does not exist on filesystem')).to.equal(false);
					expect(error.message.includes('Unexpected token')).to.equal(true);
				}
			);
		});

		it(`should not throw error with well formed schema and config provided`, () => {
			mockConfigurationHelper.getConfigFile = sandbox.stub().returns({
				foo: 'bar'
			});

			mockModule.getMock('path').join = sandbox.stub().returns('tests/support/validate/schema.json');

			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: true
			});

			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);

			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {},
				(error: { message: string }) => {
					assert.fail(
						null,
						null,
						'moduleUnderTest.run should not have rejected promise. Rejected with: ' + error.message
					);
				}
			);
		});

		it(`should throw error with a detailed schema and erroneous config`, () => {
			mockModule.getMock('path').join = sandbox.stub().returns('tests/support/validate/detailedSchema.json');

			mockConfigurationHelper.getConfigFile = sandbox.stub().throws('Invalid .dojorc');

			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: true
			});

			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);

			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.fail(null, null, 'should throw an error');
				},
				(error: { message: string }) => {}
			);
		});

		it(`should have schema mismatches with a detailed schema and incorrect config`, () => {
			mockModule.getMock('path').join = sandbox.stub().returns('tests/support/validate/detailedSchema.json');

			mockConfigurationHelper.getConfigFile = sandbox.stub().returns({
				foo: 'bar'
			});

			moduleUnderTest.logSchemaErrors = sandbox.stub();

			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: true
			});

			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);

			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.equal(consoleLogStub.callCount, 1);
					assert.isTrue(consoleLogStub.getCall(0).calledWith(red(`config.foo is not of a type(s) object`)));
				},
				(error: { message: string }) => {
					assert.fail(
						null,
						null,
						'moduleUnderTest.run should not reject because schema valid. Error: ' + error.message
					);
				}
			);
		});

		it(`should have no schema mismatches with a detailed schema and correct config`, () => {
			mockModule.getMock('path').join = sandbox.stub().returns('tests/support/validate/detailedSchema.json');

			mockConfigurationHelper.getConfigFile = sandbox.stub().returns({
				foo: {
					bar: 'foobar'
				}
			});

			mockValidate = mockModule.getModuleUnderTest();

			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: true
			});

			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);

			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.isTrue(consoleLogStub.called);
					assert.equal(consoleLogStub.callCount, 2);
					assert.isTrue(
						consoleLogStub.getCall(0).calledWith(green(`test command config validation was successful!`))
					);
					assert.isTrue(
						consoleLogStub.getCall(1).calledWith(green(`There were no issues with your config!`))
					);
				},
				(error: { message: string }) => {
					assert.fail(
						null,
						null,
						'moduleUnderTest.run should not reject because schema valid. Error: ' + error.message
					);
				}
			);
		});
	});
});
