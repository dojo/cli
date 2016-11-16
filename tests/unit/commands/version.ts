import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

import { join, resolve as pathResolve } from 'path';

import { CommandsMap, CommandWrapper } from '../../../src/command';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';
const validPackageInfo = require('intern/dojo/node!../../support/valid-package/package.json');

describe('version command', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockDavid: any;
	let mockPkgDir: any;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/commands/version');
		mockModule.dependencies(['david', 'pkg-dir']);
		mockDavid = mockModule.getMock('david');
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		sandbox.stub(console, 'log');
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
			[ 'outdated', {
				alias: 'outdated',
				describe: 'Output a list of installed commands that can be updated to a more recent stable version.',
				demand: false,
				type: 'string'
			} ]
		);
	});

	it(`should run and return 'no registered commands' when there are no installed commands`, () => {
		const noCommandOutput = `${outputPrefix()}There are no registered commands available.${outputSuffix()}`;
		const commandMap: CommandsMap = new Map<string, CommandWrapper>();

		const helper = {commandsMap: commandMap, command: 'version'};
		return moduleUnderTest.run(helper, {}).then(() => {
			assert.equal(noCommandOutput, (<sinon.SinonStub> console.log).args[0][0]);
		});
	});

	it('should run and return current versions on success', () => {
		const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'apple',
				name: 'test',
				path: join(pathResolve('.'), '_build/tests/support/valid-package')
			});

		const expectedOutput = `${outputPrefix()}The currently installed groups are:\n\n${installedCommandWrapper.group} (${validPackageInfo.name}) ${validPackageInfo.version}\n${outputSuffix()}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper],
		]);

		const helper = {commandsMap: commandMap, command: 'version'};
		return moduleUnderTest.run(helper, {}).then(() => {
			assert.equal(expectedOutput, (<sinon.SinonStub> console.log).args[0][0]);
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
			path: join(pathResolve('.'), '/commands/builtInCommand.js')
		});

		const expectedOutput = `${outputPrefix()}The currently installed groups are:\n\n${installedCommandWrapper.group} (${validPackageInfo.name}) ${validPackageInfo.version}\n${outputSuffix()}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper],
			['builtInCommand1', builtInCommandWrapper],
		]);

		const helper = {commandsMap: commandMap, command: 'version'};
		return moduleUnderTest.run(helper, {}).then(() => {
			assert.equal(expectedOutput, (<sinon.SinonStub> console.log).args[0][0]);
		});
	});

	it('should run and return current versions and latest stable version on success', () => {
		const latestStableInfo: any = {};
		latestStableInfo[validPackageInfo.name] = {'stable': '1.2.3'};
		mockDavid.getUpdatedDependencies = sandbox.stub().yields(null, latestStableInfo);
		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const expectedOutput = `${outputPrefix()}The currently installed groups are:\n\n${installedCommandWrapper.group} (${validPackageInfo.name}) ${validPackageInfo.version} \u001b[33m(can be updated to ${latestStableInfo[validPackageInfo.name].stable})\u001b[39m.\n${outputSuffix()}`;

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper]
		]);

		const helper = {commandsMap: commandMap, command: 'version', };
		return moduleUnderTest.run(helper, {'outdated': true}).then(() => {
			assert.equal('Fetching latest version information...', (<sinon.SinonStub> console.log).args[0][0]);
			assert.equal(expectedOutput, (<sinon.SinonStub> console.log).args[1][0]);
		});
	});

	function outputPrefix() {
		return `\n`;
	}
	function outputSuffix() {
		return `\nYou are currently running dojo-cli 1.0.0\n`;
	}

});
