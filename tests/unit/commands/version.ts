import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';
require('sinon-as-promised')(Promise);

import { join, resolve as pathResolve } from 'path';

import { CommandsMap, CommandWrapper } from '../../../src/command';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';
const validPackageInfo = require('intern/dojo/node!../../support/valid-package/package.json');
const anotherValidPackageInfo = require('intern/dojo/node!../../support/another-valid-package/package.json');

describe('version command', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockDavid: any;
	let mockPkgDir: any;
	let mockAllCommands: any;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/commands/version');
		mockModule.dependencies(['david', 'pkg-dir', '../allCommands']);
		mockDavid = mockModule.getMock('david');
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));
		mockAllCommands = mockModule.getMock('../allCommands');
		sandbox.stub(console, 'log');
		moduleUnderTest = mockModule.getModuleUnderTest().default;
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should register supported arguments', () => {
		const options = sandbox.stub();
		moduleUnderTest.register(options);
		assert.deepEqual(
			options.firstCall.args,
			[ 'o', {
				alias: 'outdated',
				describe: 'Output a list of installed commands and check if any can be updated to a more recent stable version.',
				demand: false,
				type: 'boolean'
			} ]
		);
	});

	it(`should run and return 'no registered commands' when there are no installed commands`, () => {
		const noCommandOutput = `${outputPrefix()}There are no registered commands available.${outputSuffix()}`;
		const commandMap: CommandsMap = new Map<string, CommandWrapper>();

		const helper = {command: 'version'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { outdated: false }).then(() => {
			assert.isTrue(mockDavid.getUpdatedDependencies.notCalled);
			assert.equal((<sinon.SinonStub> console.log).args[0][0], noCommandOutput);
		});
	});

	it(`should run and return 'no registered commands' when passed an invalid path to an installed command`, () => {
		const noCommandOutput = `${outputPrefix()}There are no registered commands available.${outputSuffix()}`;

		const badCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), 'path/that/does/not/exist')
		});

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['badCommand', badCommandWrapper]
		]);
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});

		const helper = {command: 'version'};
		return moduleUnderTest.run(helper, { outdated: false }).then(() => {
			assert.isTrue(mockDavid.getUpdatedDependencies.notCalled);
			assert.equal((<sinon.SinonStub> console.log).args[0][0], noCommandOutput);
		});
	});

	it('should run and return current versions on success', () => {
		const installedCommandWrapper1 = getCommandWrapperWithConfiguration({
				group: 'apple',
				name: 'test',
				path: join(pathResolve('.'), '_build/tests/support/valid-package')
			});
		const installedCommandWrapper2 = getCommandWrapperWithConfiguration({
			group: 'orange',
			name: 'anotherTest',
			path: join(pathResolve('.'), '_build/tests/support/another-valid-package')
		});

		const expectedOutput = `${outputPrefix()}The currently installed groups are:\n\n${installedCommandWrapper1.group} (${validPackageInfo.name}) ${validPackageInfo.version}\n${installedCommandWrapper2.group} (${anotherValidPackageInfo.name}) ${anotherValidPackageInfo.version}\n${outputSuffix()}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper1],
			['installedCommand2', installedCommandWrapper2]
		]);
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		const helper = {command: 'version'};
		return moduleUnderTest.run(helper, { outdated: false }).then(() => {
			assert.isTrue(mockDavid.getUpdatedDependencies.notCalled);
			assert.equal((<sinon.SinonStub> console.log).args[0][0], expectedOutput);
		});
	});

	it('should ignore builtin commands when outputting version info', () => {
		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const builtInCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'orange',
			name: 'anotherTest',
			path: join(pathResolve('.'), '/_build/src/commands/builtInCommand.js')
		});

		const expectedOutput = `${outputPrefix()}The currently installed groups are:\n\n${installedCommandWrapper.group} (${validPackageInfo.name}) ${validPackageInfo.version}\n${outputSuffix()}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper],
			['builtInCommand1', builtInCommandWrapper]
		]);

		const helper = {command: 'version'};
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { outdated: false }).then(() => {
			assert.isTrue(mockDavid.getUpdatedDependencies.notCalled);
			assert.equal((<sinon.SinonStub> console.log).args[0][0], expectedOutput);
		});
	});

	it('should run and return current versions and latest version on success', () => {
		const latestStableInfo: any = {};
		mockDavid.getUpdatedDependencies = sandbox.stub().yields(null, latestStableInfo);
		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const expectedOutput = `${outputPrefix()}The currently installed groups are:\n\n${installedCommandWrapper.group} (${validPackageInfo.name}) ${validPackageInfo.version} (on latest stable version).\n${outputSuffix()}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper]
		]);

		const helper = {command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { 'outdated': true }).then(() => {
			assert.equal('Fetching latest version information...', (<sinon.SinonStub> console.log).args[0][0]);
			assert.equal((<sinon.SinonStub> console.log).args[1][0], expectedOutput);
		});
	});

	it('should run and return current versions and upgrade to latest version on success', () => {
		const latestStableInfo: any = {};
		latestStableInfo[validPackageInfo.name] = {'latest': '1.2.3'};
		mockDavid.getUpdatedDependencies = sandbox.stub().yields(null, latestStableInfo);
		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const expectedOutput = `${outputPrefix()}The currently installed groups are:\n\n${installedCommandWrapper.group} (${validPackageInfo.name}) ${validPackageInfo.version} \u001b[33m(can be updated to ${latestStableInfo[validPackageInfo.name].latest})\u001b[39m.\n${outputSuffix()}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper]
		]);

		const helper = {command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { 'outdated': true }).then(() => {
			assert.equal('Fetching latest version information...', (<sinon.SinonStub> console.log).args[0][0]);
			assert.equal((<sinon.SinonStub> console.log).args[1][0], expectedOutput);
		});
	});

	it('should return an error if fetching latest versions fails', () => {
		const davidError = new Error('ugh - oh noes');
		mockDavid.getUpdatedDependencies = sandbox.stub().yields(davidError, null);
		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const expectedOutput = `Something went wrong trying to fetch command versions: ${davidError.message}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper]
		]);

		const helper = {command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves({commandsMap: commandMap});
		return moduleUnderTest.run(helper, { 'outdated': true }).then(() => {
			assert.equal('Fetching latest version information...', (<sinon.SinonStub> console.log).args[0][0]);
			assert.equal((<sinon.SinonStub> console.log).args[1][0], expectedOutput);
		});
	});

	function outputPrefix() {
		return `\n`;
	}
	function outputSuffix() {
		return `\nYou are currently running @dojo/cli 1.0.0\n`;
	}
});
