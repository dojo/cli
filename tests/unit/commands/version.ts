const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';
import chalk from 'chalk';

import { join, resolve as pathResolve } from 'path';

import { CommandMap, CommandWrapper } from '../../../src/interfaces';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';
const validPackageInfo: any = require('../../support/valid-package/package.json');
const anotherValidPackageInfo: any = require('../../support/another-valid-package/package.json');

const outputPrefix = 'The currently installed commands are:\n';
const noCommandsPrefix = 'There are no registered commands available.';
const outputSuffix = '\nYou are currently running @dojo/cli@' + chalk.blue('1.0.0');

describe('version command', () => {
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockPkgDir: any;
	let mockAllCommands: any;
	let mockInstallableCommands: any;
	let sandbox: sinon.SinonSandbox;
	let logStub: sinon.SinonStub;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../../src/commands/version', require);
		mockModule.dependencies(['pkg-dir', '../allCommands', '../installableCommands']);
		mockPkgDir = mockModule.getMock('pkg-dir');
		mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));
		mockAllCommands = mockModule.getMock('../allCommands');
		mockInstallableCommands = mockModule.getMock('../installableCommands');
		mockInstallableCommands.getLatestCommands = sandbox.stub().resolves([]);
		logStub = sandbox.stub(console, 'log');
		moduleUnderTest = mockModule.getModuleUnderTest().default;
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should register supported arguments', () => {
		const options = sandbox.stub();
		moduleUnderTest.register(options);
		assert.deepEqual(options.firstCall.args, [
			'o',
			{
				alias: 'outdated',
				describe:
					'Output a list of installed commands and check if any can be updated to a more recent stable version.',
				demand: false,
				type: 'boolean'
			}
		]);
	});

	it(`should run and return 'no registered commands' when there are no installed commands`, () => {
		const noCommandOutput = `${noCommandsPrefix}${outputSuffix}`;
		const groupMap = new Map();

		const helper = { command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves(groupMap);
		return moduleUnderTest.run(helper, { outdated: false }).then(
			() => {
				assert.equal(logStub.firstCall.args[0].trim(), noCommandOutput);
			},
			() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			}
		);
	});

	it(`should run and return 'no registered commands' when passed an invalid path to an installed command`, () => {
		const noCommandOutput = `${noCommandsPrefix}${outputSuffix}`;

		const badCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), 'path/that/does/not/exist')
		});

		const commandMap: CommandMap = new Map<string, CommandWrapper>([['badCommand', badCommandWrapper]]);
		const groupMap = new Map([['apple', commandMap]]);
		mockAllCommands.default = sandbox.stub().resolves(groupMap);

		const helper = { command: 'version' };
		return moduleUnderTest.run(helper, { outdated: false }).then(
			() => {
				// assert.isTrue(mockDavid.getUpdatedDependencies.notCalled);
				assert.equal(logStub.firstCall.args[0].trim(), noCommandOutput);
			},
			() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			}
		);
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

		const expectedOutput = `${outputPrefix}
${validPackageInfo.name}@${validPackageInfo.version}
${anotherValidPackageInfo.name}@${anotherValidPackageInfo.version}
${outputSuffix}`;

		const commandMap: CommandMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper1],
			['installedCommand2', installedCommandWrapper2]
		]);
		const groupMap = new Map([['test', commandMap]]);
		mockAllCommands.default = sandbox.stub().resolves(groupMap);
		const helper = { command: 'version' };
		return moduleUnderTest.run(helper, { outdated: false }).then(
			() => {
				assert.equal(logStub.firstCall.args[0].trim(), expectedOutput);
			},
			() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			}
		);
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

		const expectedOutput = `${outputPrefix}
${validPackageInfo.name}@${validPackageInfo.version}
${outputSuffix}`;

		const commandMap: CommandMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper],
			['builtInCommand1', builtInCommandWrapper]
		]);
		const groupMap = new Map([['test', commandMap]]);

		const helper = { command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves(groupMap);
		return moduleUnderTest.run(helper, { outdated: false }).then(
			() => {
				assert.equal(logStub.firstCall.args[0].trim(), expectedOutput);
			},
			() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			}
		);
	});

	it('should run and return current versions and latest version on success', () => {
		mockInstallableCommands.getLatestCommands = sandbox.stub().resolves([
			{
				name: 'Test Package 1',
				version: '1.0.0'
			}
		]);

		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const expectedOutput = `${outputPrefix}
${validPackageInfo.name}@${chalk.blue(validPackageInfo.version)}
${outputSuffix}`;

		const commandMap: CommandMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper]
		]);
		const groupMap = new Map([['test', commandMap]]);

		const helper = { command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves(groupMap);
		return moduleUnderTest.run(helper, { outdated: true }).then(
			() => {
				assert.isTrue(logStub.firstCall.calledWith('Fetching latest version information...'));
				assert.equal(logStub.secondCall.args[0].trim(), expectedOutput);
			},
			() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			}
		);
	});

	it('should run and return current versions and upgrade to latest version on success', () => {
		mockInstallableCommands.getLatestCommands = sandbox.stub().resolves([
			{
				name: 'Test Package 1',
				version: '1.2.3'
			}
		]);
		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const expectedOutput = `${outputPrefix}
${validPackageInfo.name}@${chalk.blue(validPackageInfo.version)} ${chalk.green('(latest is 1.2.3)')}
${outputSuffix}`;

		const commandMap: CommandMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper]
		]);
		const groupMap = new Map([['test', commandMap]]);

		const helper = { command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves(groupMap);
		return moduleUnderTest.run(helper, { outdated: true }).then(
			() => {
				assert.isTrue(logStub.firstCall.calledWith('Fetching latest version information...'));
				assert.equal(logStub.secondCall.args[0].trim(), expectedOutput);
			},
			() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			}
		);
	});

	it('should return an error if fetching latest versions fails', () => {
		mockInstallableCommands.getLatestCommands = sandbox.stub().throws();

		const installedCommandWrapper = getCommandWrapperWithConfiguration({
			group: 'apple',
			name: 'test',
			path: join(pathResolve('.'), '_build/tests/support/valid-package')
		});

		const expectedOutput = 'Something went wrong trying to fetch command versions: Error';

		const commandMap: CommandMap = new Map<string, CommandWrapper>([
			['installedCommand1', installedCommandWrapper]
		]);
		const groupMap = new Map([['test', commandMap]]);

		const helper = { command: 'version' };
		mockAllCommands.default = sandbox.stub().resolves(groupMap);
		return moduleUnderTest.run(helper, { outdated: true }).then(
			() => {
				assert.isTrue(logStub.firstCall.calledWith('Fetching latest version information...'));
				assert.isTrue(logStub.secondCall.calledWith(expectedOutput));
			},
			() => {
				assert.fail(null, null, 'moduleUnderTest.run should not have rejected promise');
			}
		);
	});
});
