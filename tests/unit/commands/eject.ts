import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';
import { red, yellow, underline } from 'chalk';
require('sinon-as-promised')(Promise);

import { join, resolve as pathResolve } from 'path';

import { CommandsMap, CommandWrapper } from '../../../src/command';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';

describe('eject command', () => {
	const ejectPackagePath = join(pathResolve('.'), '/_build/tests/support/eject');
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockPkgDir: any;
	let mockFs: any;
	let mockFsExtra: any;
	let mockInquirer: any;
	let mockNpmInstall: any;
	let mockPackageJson: any;
	let mockAllCommands: any;
	let sandbox: sinon.SinonSandbox;

	function loadCommand(command: string): any {
		return require(`intern/dojo/node!${ejectPackagePath}/${command}`);
	}

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/commands/eject');
		mockModule.dependencies(['inquirer', 'fs', 'fs-extra', 'pkg-dir', '../allCommands', '../npmInstall', `${ejectPackagePath}/package.json`]);
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(ejectPackagePath);
		mockFs = mockModule.getMock('fs');
		mockFsExtra = mockModule.getMock('fs-extra');
		mockInquirer = mockModule.getMock('inquirer');
		mockInquirer.prompt = sandbox.stub().resolves({ eject: true });
		mockAllCommands = mockModule.getMock('../allCommands');
		mockNpmInstall = mockModule.getMock('../npmInstall');
		mockPackageJson = mockModule.getMock(`${ejectPackagePath}/package.json`);
		mockPackageJson.dependencies = {
			blah: '1.0.1',
			blah2: '1.0.1'
		};
		mockPackageJson.devDependencies = {
			blah: '1.0.1',
			blah2: '1.0.1'
		};
		mockPackageJson.scripts = {
			blah: 'pwd',
			blah2: 'pwd'
		};
		sandbox.stub(console, 'log');
		sandbox.stub(console, 'warn');
		moduleUnderTest = mockModule.getModuleUnderTest().default;
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should register supported arguments', () => {
		const helper = { yargs: { option: sandbox.stub() } };
		moduleUnderTest.register(helper);
		assert.deepEqual(
			helper.yargs.option.firstCall.args,
			[ 'g', {
				alias: 'group',
				describe: 'the group to eject commands from'
			} ]
		);
		assert.deepEqual(
			helper.yargs.option.secondCall.args,
			[ 'c', {
				alias: 'command',
				describe: 'the command to eject - a `group` is required'
			} ]
		);
	});

	it(`should abort eject when 'N' selected`, () => {
		const abortOutput = 'Aborting eject';
		const commandMap: CommandsMap = new Map<string, CommandWrapper>();

		const helper = {command: 'eject'};
		mockInquirer.prompt = sandbox.stub().resolves({ eject: false });
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, {}).catch((error: { message: string }) => {
			assert.equal(error.message, abortOutput);
		});
	});

	it(`should output 'nothing to do' when only eject and version are registered`, () => {
		const runOutput = 'nothing to do';
		const installedCommandWrapper1 = getCommandWrapperWithConfiguration({
			group: 'eject',
			name: ''
		});
		const installedCommandWrapper2 = getCommandWrapperWithConfiguration({
			group: 'version',
			name: ''
		});

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['eject', installedCommandWrapper1],
			['version', installedCommandWrapper2]
		]);
		const helper = {command: 'eject'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, {}).catch((error: { message: string }) => {
			assert.equal(error.message, runOutput);
		});
	});

	it(`should show warning messages when command has no 'eject' method defined`, () => {
		function output(group: string): string {
			return `${red('WARN')} 'eject' is not defined for ${group}/test, skipping...`;
		}
		const installedCommandWrapper1 = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test'
		});
		const installedCommandWrapper2 = getCommandWrapperWithConfiguration({
			group: 'orange',
			name: 'test'
		});
		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['apple', installedCommandWrapper1],
			['orange', installedCommandWrapper2]
		]);
		const helper = {command: 'eject'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, {}).then(() => {
			assert.equal((<sinon.SinonStub> console.warn).args[0][0], output('apple'));
			assert.equal((<sinon.SinonStub> console.warn).args[1][0], output('orange'));
		});
	});

	it(`should eject only the commands under 'group' passed in via 'group' argument`, () => {
		const appleCommand = {...loadCommand('command-with-eject-success')};
		const orangeCommand = {...loadCommand('command-with-eject-success')};
		const blueberryCommand = getCommandWrapperWithConfiguration({
			group: 'fruit',
			name: 'blueberry'
		});
		appleCommand.name = 'apple';
		orangeCommand.name = 'orange';
		blueberryCommand.eject = function () {};
		const appleEjectStub = sandbox.stub(appleCommand, 'eject');
		const orangeEjectStub = sandbox.stub(orangeCommand, 'eject');
		const blueberryEjectStub = sandbox.stub(blueberryCommand, 'eject');
		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['apple', appleCommand],
			['orange', orangeCommand],
			['blueberry', blueberryCommand]
		]);
		const helper = {command: 'eject'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { group: 'test-group' }).then(() => {
			assert.isTrue(appleEjectStub.called);
			assert.isTrue(orangeEjectStub.called);
			assert.isFalse(blueberryEjectStub.called);
		});
	});

	it(`should eject only the command passed in via the 'command' argument`, () => {
		const appleCommand = {...loadCommand('command-with-eject-success')};
		const orangeCommand = {...loadCommand('command-with-eject-success')};
		const blueberryCommand = getCommandWrapperWithConfiguration({
			group: 'fruit',
			name: 'blueberry'
		});
		appleCommand.name = 'apple';
		orangeCommand.name = 'orange';
		blueberryCommand.eject = function () {};
		const appleEjectStub = sandbox.stub(appleCommand, 'eject');
		const orangeEjectStub = sandbox.stub(orangeCommand, 'eject');
		const blueberryEjectStub = sandbox.stub(blueberryCommand, 'eject');
		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['apple', appleCommand],
			['orange', orangeCommand],
			['blueberry', blueberryCommand]
		]);
		const helper = {command: 'eject'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { group: 'test-group', command: 'apple' }).then(() => {
			assert.isTrue(appleEjectStub.called);
			assert.isFalse(orangeEjectStub.called);
			assert.isFalse(blueberryEjectStub.called);
		});
	});

	it(`should error when 'eject' doesn't exist on command passed in via 'command' argument`, () => {
		const blueberryCommand = getCommandWrapperWithConfiguration({
			group: 'test-group',
			name: 'blueberry'
		});
		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['blueberry', blueberryCommand]
		]);
		const helper = {command: 'eject'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { group: 'test-group', command: 'blueberry' }).catch((error: { message: string }) => {
			assert.equal(error.message, `'eject' is not defined for command test-group/blueberry`);
		});
	});

	it(`should error when command passed in via 'command' argument doesn't exist`, () => {
		const blueberryCommand = getCommandWrapperWithConfiguration({
			group: 'test-group',
			name: 'blueberry'
		});
		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['blueberry', blueberryCommand]
		]);
		const helper = {command: 'eject'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { group: 'test-group', command: 'apple' }).catch((error: { message: string }) => {
			assert.equal(error.message, `command test-group/apple does not exist`);
		});
	});

	describe('eject command helpers', () => {
		function addedNpmOutput(npmProperty: string, type: string) {
			return `	adding ${yellow(npmProperty)} to ${type}`;
		}
		function warnNpmOutput(npmProperty: string, type: string) {
			return `${red('WARN')}    ${type} ${npmProperty} already exists at version '1.0.1' and will be overwritten by version '1.0.1'`;
		}
		function errorNpmScript(script: string) {
			return `package script ${yellow(script)} already exists`;
		}

		it('should run npm install helper', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('command-with-eject-success')]
			]);
			const helper = {command: 'eject'};
			mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.isTrue(mockNpmInstall.default.called);
				assert.equal((<sinon.SinonStub> console.log).args[0][0], addedNpmOutput('bar', 'devDependencies'));
				assert.equal((<sinon.SinonStub> console.log).args[1][0], addedNpmOutput('foo', 'dependencies'));
				assert.equal((<sinon.SinonStub> console.log).args[2][0], addedNpmOutput('baz', 'scripts'));
				assert.equal((<sinon.SinonStub> console.log).args[3][0], underline('running npm install...'));
			});
		});

		it(`should create npm sections if they don't exist`, () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('command-with-eject-success')]
			]);
			const helper = {command: 'eject'};
			delete mockPackageJson.dependencies;
			delete mockPackageJson.devDependencies;
			delete mockPackageJson.scripts;
			mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.isTrue(mockNpmInstall.default.called);
				assert.equal((<sinon.SinonStub> console.log).args[0][0], addedNpmOutput('bar', 'devDependencies'));
				assert.equal((<sinon.SinonStub> console.log).args[1][0], addedNpmOutput('foo', 'dependencies'));
				assert.equal((<sinon.SinonStub> console.log).args[2][0], addedNpmOutput('baz', 'scripts'));
				assert.equal((<sinon.SinonStub> console.log).args[3][0], underline('running npm install...'));
			});
		});

		it('should throw warning if npm dependency collision is detected', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('command-with-eject-duplicate-deps')]
			]);
			const helper = {command: 'eject'};
			mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.equal((<sinon.SinonStub> console.warn).args[0][0], warnNpmOutput('blah', 'dependency'));
				assert.equal((<sinon.SinonStub> console.log).args[1][0], underline('running npm install...'));
			});
		});

		it('should throw warning if npm devDependency collision is detected', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('/command-with-eject-duplicate-dev-deps')]
			]);
			const helper = {command: 'eject'};
			mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.equal((<sinon.SinonStub> console.warn).args[0][0], warnNpmOutput('blah', 'devDependency'));
				assert.equal((<sinon.SinonStub> console.log).args[1][0], underline('running npm install...'));
			});
		});

		it('should throw error if npm script collision is detected', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('/command-with-eject-duplicate-script')]
			]);
			const helper = {command: 'eject'};
			mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).catch((error: { message: string }) => {
				assert.equal(error.message, errorNpmScript('blah'));
			});
		});

		it('should run copy files helper', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('/command-with-eject-success')]
			]);
			const helper = {command: 'eject'};
			mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).then(() => {
				assert.equal((<sinon.SinonStub> console.log).args[4][0], `creating folder: ${yellow(join(ejectPackagePath, 'another-valid-package'))}`);
				assert.equal((<sinon.SinonStub> console.log).args[5][0], `creating folder: ${yellow(join(ejectPackagePath, 'commands'))}`);
				assert.equal((<sinon.SinonStub> console.log).args[6][0], underline(`\n\ncopying files into current project at: ${yellow(ejectPackagePath)}`));
				assert.equal((<sinon.SinonStub> console.log).args[7][0], `	copying ${yellow(join(ejectPackagePath, '../blah.js'))} to the project which will now be located at: ${yellow(join(ejectPackagePath, 'blah.js'))}`);
				assert.equal((<sinon.SinonStub> console.log).args[8][0], `	copying ${yellow(join(ejectPackagePath, '../another-valid-package/package.json'))} to the project which will now be located at: ${yellow(join(ejectPackagePath, 'another-valid-package/package.json'))}`);
				assert.equal((<sinon.SinonStub> console.log).args[9][0], `	copying ${yellow(join(ejectPackagePath, '../commands/invalid-built-in-command.js'))} to the project which will now be located at: ${yellow(join(ejectPackagePath, 'commands/invalid-built-in-command.js'))}`);
			});
		});

		it('should throw error if file copy collision is detected', () => {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', loadCommand('/command-with-eject-duplicate-file')]
			]);
			const helper = {command: 'eject'};
			mockFs.existsSync = sandbox.stub().returns(true);
			mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
			return moduleUnderTest.run(helper, {}).catch((error: { message: string }) => {
				assert.equal(error.message, `File already exists: ${join(ejectPackagePath, 'package.json')}`);
			});
		});
	});
});
