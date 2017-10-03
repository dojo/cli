import { yellow, underline } from 'chalk';
import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import { join, resolve as pathResolve, sep } from 'path';
import * as sinon from 'sinon';

import { CommandsMap, CommandWrapper } from '../../../src/command';
import MockModule from '../../support/MockModule';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';
require('sinon-as-promised')(Promise);

describe('eject command', () => {
	const ejectPackagePath = join(pathResolve('.'), '/_build/tests/support/eject');
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockPkgDir: any;
	let mockFsExtra: any;
	let mockInquirer: any;
	let mockNpmInstall: any;
	let mockPackageJson: any;
	let mockAllExternalCommands: any;
	let consoleLogStub: sinon.SinonStub;
	let consoleWarnStub: sinon.SinonStub;
	let sandbox: sinon.SinonSandbox;

	function loadCommand(command: string): any {
		return require(`intern/dojo/node!${ejectPackagePath}/${command}`);
	}

	function getHelper(config?: any) {
		const basicHelper = {
			command: 'eject',
			configuration: {
				get: sandbox.stub().returns({}),
				set: sandbox.stub()
			}
		};

		return Object.assign({}, basicHelper, config);
	}

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/commands/eject');
		mockModule.dependencies(['inquirer', 'fs', 'fs-extra', 'pkg-dir', '../allCommands', '../npmInstall', `${ejectPackagePath}/package.json`, '../configurationHelper']);
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(ejectPackagePath);
		mockFsExtra = mockModule.getMock('fs-extra');
		mockFsExtra.copySync = sandbox.stub();
		mockInquirer = mockModule.getMock('inquirer');
		mockInquirer.prompt = sandbox.stub().resolves({ eject: true });
		mockAllExternalCommands = mockModule.getMock('../allCommands');
		mockNpmInstall = mockModule.getMock('../npmInstall');
		mockPackageJson = mockModule.getMock(`${ejectPackagePath}/package.json`);
		consoleLogStub = sandbox.stub(console, 'log');
		consoleWarnStub = sandbox.stub(console, 'warn');
		moduleUnderTest = mockModule.getModuleUnderTest().default;
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it(`should abort eject when 'N' selected`, () => {
		const abortOutput = 'Aborting eject';
		const commandMap: CommandsMap = new Map<string, CommandWrapper>();

		const helper = getHelper();
		mockInquirer.prompt = sandbox.stub().resolves({ eject: false });
		mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, {}).catch((error: { message: string }) => {
			assert.equal(error.message, abortOutput);
		});
	});

	it(`should warn if all commands are skipped`, () => {
		const runOutput = 'There are no commands that can be ejected';
		const installedCommandWrapper1 = getCommandWrapperWithConfiguration({
			group: 'command',
			name: ''
		});

		const installedCommandWrapper2 = getCommandWrapperWithConfiguration({
			group: 'version',
			name: ''
		});

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['command', installedCommandWrapper1],
			['version', installedCommandWrapper2]
		]);
		const helper = getHelper();
		mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, {}).then(() => {
			assert.equal(consoleLogStub.args[0][0], runOutput);
		}).catch(() => {
			assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
		});
	});

	describe('save ejected config', () => {
		it('should save config', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('command-with-full-eject')]
			]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves({commandsMap: commandMap});

			const configurationHelper = mockModule.getMock('../configurationHelper').default;

			const setStub = sinon.stub();
			configurationHelper.sandbox = sinon.stub().returns({
				set: setStub
			});

			return moduleUnderTest.run(helper, {}).then(() => {
				assert.isTrue(setStub.calledOnce);
				assert.isTrue(setStub.firstCall.calledWith({ ejected: true }));
			}).catch(() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			});
		});
	});

	describe('eject npm config', () => {
		it('should run npm install', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('command-with-full-eject')]
			]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.isTrue(mockNpmInstall.installDependencies.calledOnce);
				assert.isTrue(mockNpmInstall.installDevDependencies.calledOnce);
			}).catch(() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			});
		});
	});

	describe('eject copy config', () => {
		it('should run copy files', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('/command-with-full-eject')]
			]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.isTrue(consoleLogStub.secondCall.calledWith(` ${yellow('creating')} .${sep}config${sep}test-group-test-eject${sep}file1`));
				assert.isTrue(consoleLogStub.thirdCall.calledWith(` ${yellow('creating')} .${sep}config${sep}test-group-test-eject${sep}file2`));
				assert.isTrue(mockFsExtra.copySync.calledTwice);
			}).catch(() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			});
		});

		it('should not copy files if no files are specified', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('/command-with-nofile-eject')]
			]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.isTrue(mockFsExtra.copySync.notCalled);
			}).catch(() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			});
		});
	});

	describe('eject hints', () => {
		it('should show hints when supplied', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('/command-with-hints')]
			]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				const logCallCount = consoleLogStub.callCount;
				assert.isTrue(consoleLogStub.callCount > 3, '1');
				const hintsCall = logCallCount - 3;
				assert.isTrue(consoleLogStub.getCall(hintsCall).calledWith(underline('\nhints')), 'should underline hints');
				assert.isTrue(consoleLogStub.getCall(hintsCall + 1).calledWith(' hint 1'), 'should show hint1');
				assert.isTrue(consoleLogStub.getCall(hintsCall + 2).calledWith(' hint 2'), 'should show hint2');
			}).catch(() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			});
		});
	});
});
