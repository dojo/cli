import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

import { LoadedCommands } from '../../../src/loadCommands';
import { CommandsMap, CommandWrapper } from '../../../src/command';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';

describe('cli .bin', () => {
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockYargs: any;
	let mockAllCommandsPromise: Promise<any>;
	let mockAllCommands: any;
	let mockRegisterCommands: any;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/bin/dojo');
		mockModule.dependencies(['yargs', './allCommands', './registerCommands']);
		mockYargs = mockModule.getMock('yargs');
		mockYargs.ctor.command = sandbox.stub();
		mockYargs.ctor.demand = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.usage = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.epilog = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.help = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.alias = sandbox.stub().returns(mockYargs.ctor);
		mockYargs.ctor.strict = sandbox.stub().returns(mockYargs.ctor);
		mockAllCommands = mockModule.getMock('./allCommands');
		const commands: LoadedCommands = {
			commandsMap: new Map(),
			yargsCommandNames: new Map()
		};
		const installedCommandWrapper1 = getCommandWrapperWithConfiguration({
			group: 'eject',
			name: ''
		});
		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['eject', installedCommandWrapper1]
		]);
		commands.commandsMap = commandMap;
		mockAllCommandsPromise = new Promise((resolve) => setTimeout(() => {
			resolve(commands);
		}, 1000));
		mockAllCommands.default = sandbox.stub().resolves(mockAllCommandsPromise);
		mockRegisterCommands = mockModule.getMock('./registerCommands');
		mockRegisterCommands.default = sandbox.stub();
		moduleUnderTest = mockModule.getModuleUnderTest();

		// Give a stacktrace for the unhandled rejections should they occur
		process.on('unhandledRejection', (reason: string, p: any) => {
			assert.fail('Unhandled Rejection at: Promise', p, 'reason:', reason);
		});
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should call registerCommands', () => {
		mockAllCommandsPromise.then(() => {
			setTimeout(() => {
				assert.isTrue(mockRegisterCommands.default.called);
			}, 100);
		})
		.catch((error: Error) => {
			assert.fail(error.message);
		});
	});
});
