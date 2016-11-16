import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

import { join, resolve as pathResolve } from 'path';

import { CommandsMap, CommandWrapper } from '../../../src/command';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';

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
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		//sandbox.stub(console, 'log');
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

	it('should run and return current versions on success', () => {
		mockPkgDir.ctor.sync = sandbox.stub().returns(join(pathResolve('.'), '/_build/tests/support/valid-package'));
		const goodVersion = `There are no registered commands available.\nYou are currently running dojo-cli 1.0.0\n`;
		const commandWrapper1 = getCommandWrapperWithConfiguration({
				group: 'apple',
				name: 'test',
				path: '../tests/support/valid-package'
			}),
			commandWrapper2 = getCommandWrapperWithConfiguration({
				group: 'banana',
				name: 'test 2',
				path: '../tests/support'
			});

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['banana', commandWrapper2],
			['apple', commandWrapper1]
		]);

		const helper = {commandsMap: commandMap, command: 'version'};
		return moduleUnderTest.run(helper, {}).then(() => {
			assert.isTrue((<sinon.SinonStub> console.log).calledWith(goodVersion));
		});
	});

});
