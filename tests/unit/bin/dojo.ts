const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

import { CommandMap, CommandWrapper, GroupMap } from '../../../src/interfaces';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';

describe('cli .bin', () => {
	let mockModule: MockModule;
	let mockYargs: any;
	let mockAllCommandsPromise: Promise<any>;
	let mockAllCommands: any;
	let mockRegisterCommands: any;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../../src/bin/dojo', require);
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
		const installedCommandWrapper1 = getCommandWrapperWithConfiguration({
			group: 'eject',
			name: ''
		});
		const commandMap: CommandMap = new Map<string, CommandWrapper>([['eject', installedCommandWrapper1]]);
		const groupMap: GroupMap = new Map<string, CommandMap>([['eject', commandMap]]);
		mockAllCommandsPromise = new Promise((resolve) =>
			setTimeout(() => {
				resolve(groupMap);
			}, 1000)
		);
		mockAllCommands.default = sandbox.stub().resolves(mockAllCommandsPromise);
		mockRegisterCommands = mockModule.getMock('./registerCommands');
		mockRegisterCommands.default = sandbox.stub();

		// Give a stacktrace for the unhandled rejections should they occur
		process.on('unhandledRejection', (reason: string, p: any) => {
			assert.fail(null, null, 'Unhandled Rejection at: Promise' + p + 'reason:' + reason);
		});
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should call registerCommands', () => {
		mockAllCommandsPromise
			.then(() => {
				setTimeout(() => {
					assert.isTrue(mockRegisterCommands.default.called);
				}, 100);
			})
			.catch((error: Error) => {
				assert.fail(null, null, error.message);
			});
	});
});
