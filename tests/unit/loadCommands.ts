const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { join } from 'path';
import { stub, SinonStub, sandbox } from 'sinon';
import { CliConfig } from '../../src/interfaces';
import MockModule from '../support/MockModule';
import { getCommandWrapper } from '../support/testHelper';
import {
	enumerateBuiltInCommands as enumBuiltInCommands,
	enumerateInstalledCommands as enumInstalledCommands,
	loadCommands
} from '../../src/loadCommands';

let loadStub: SinonStub;
let commandWrapper1: any;
let commandWrapper2: any;
let consoleStub: SinonStub;
let goodConfig: CliConfig;
let mockModule: MockModule;
let mockedLoadCommands: any;
let testSandbox: any;

function config(invalid = false): CliConfig {
	// tests are run in package-dir (from cli, using grunt test) - FIX to use pkg-dir
	const config: CliConfig = {
		searchPaths: ['dist/dev/tests/support'],
		searchPrefixes: ['test-prefix'],
		builtInCommandLocation: join(__dirname, '../support/commands')
	};
	const badConfig: CliConfig = {
		searchPaths: ['just/garbage', 'yep/really/bad/paths/here'],
		searchPrefixes: ['bad-prefix'],
		builtInCommandLocation: 'dirThatDoesNotExist'
	};

	return invalid ? badConfig : config;
}

registerSuite('loadCommands', {
	beforeEach() {
		consoleStub = stub(console, 'error');
		commandWrapper1 = getCommandWrapper('command1');
		commandWrapper2 = getCommandWrapper('command2');
		loadStub = stub();
		goodConfig = config();
	},
	afterEach() {
		consoleStub.restore();
	},

	tests: {
		'successful enumeration': {
			beforeEach() {
				loadStub.onFirstCall().returns(commandWrapper1);
				loadStub.onSecondCall().returns(commandWrapper2);
			},

			tests: {
				async 'Should successfully enumerate installed commands'() {
					const installedPaths = await enumInstalledCommands(goodConfig);
					assert.equal(installedPaths.length, 2);
				},
				async 'Should successfully enumerate builtin commands'() {
					const builtInPaths = await enumBuiltInCommands(goodConfig);
					assert.equal(builtInPaths.length, 2); // includes invalid commands
				}
			}
		},
		'unsuccessful enumeration': {
			async 'Should fail to find installed commands that dont exist'() {
				goodConfig.searchPrefixes = ['bad-prefix'];
				const badPrefixPaths = await enumInstalledCommands(goodConfig);
				assert.equal(badPrefixPaths.length, 0);

				const badInstalledPaths = await enumInstalledCommands(config(true));
				assert.equal(badInstalledPaths.length, 0);
			},
			async 'Should fail to find built in commands that dont exist'() {
				const badBuiltInPaths = await enumBuiltInCommands(config(true));
				assert.equal(badBuiltInPaths.length, 0);
			}
		},
		'successful load': {
			beforeEach() {
				loadStub.onFirstCall().returns(commandWrapper1);
				loadStub.onSecondCall().returns(commandWrapper2);
				goodConfig = config();
			},

			tests: {
				async 'Should set first loaded command of each group to be the default'() {
					const installedPaths = await enumInstalledCommands(goodConfig);
					const groupMap = await loadCommands(installedPaths, loadStub);

					assert.isTrue(loadStub.calledTwice);
					assert.equal(groupMap.size, 1);
					assert.equal(groupMap.get(commandWrapper1.group)!.size, 2);
					const command = groupMap.get(commandWrapper1.group)!.get(commandWrapper1.name)!;
					assert.isTrue(command.default);
				},
				async 'should apply loading precedence to duplicate commands'() {
					const duplicateCommandName = 'command1';
					const duplicateGroupName = 'foo';
					const commandWrapperDuplicate = getCommandWrapper(duplicateCommandName);
					loadStub.onFirstCall().returns(commandWrapper1);
					loadStub.onSecondCall().returns(commandWrapperDuplicate);

					const installedPaths = await enumInstalledCommands(goodConfig);
					const groupMap = await loadCommands(installedPaths, loadStub);

					assert.isTrue(loadStub.calledTwice);
					const groupCommandSet = groupMap.get(duplicateGroupName);

					assert.equal(1, groupCommandSet!.size);
					assert.isTrue(groupCommandSet!.has(duplicateCommandName));
				}
			}
		},
		'unsuccessful load': {
			async 'Should fail to load modules that dont satisfy the Command interface'() {
				const failConfig = {
					searchPaths: ['dist/dev/tests/support'],
					searchPrefixes: ['esmodule-fail']
				};
				const installedPaths = await enumInstalledCommands(<any>failConfig);

				loadStub.onFirstCall().throws();
				try {
					await loadCommands(installedPaths, loadStub);
				} catch (error) {
					assert.isTrue(error instanceof Error);
					assert.isTrue(error.message.indexOf('Failed to load module') > -1);
				}
			}
		},
		'ejected commands': {
			beforeEach() {
				testSandbox = sandbox.create();
				mockModule = new MockModule('../../src/loadCommands', require);
				mockModule.dependencies(['./configurationHelper']);
				const configHelper = mockModule.getMock('./configurationHelper').default;
				testSandbox.stub(configHelper, 'sandbox').returns({
					get: testSandbox.stub().returns({ ejected: true })
				});
				mockedLoadCommands = mockModule.getModuleUnderTest().loadCommands;
			},
			afterEach() {
				mockModule.destroy();
				testSandbox.restore();
			},

			tests: {
				async 'Should not load rejected commands'() {
					loadStub.onFirstCall().returns(commandWrapper1);
					loadStub.onSecondCall().returns(commandWrapper2);
					goodConfig = config();

					const installedPaths = await enumInstalledCommands(goodConfig);
					const groupMap = await mockedLoadCommands(installedPaths, loadStub);

					assert.equal(groupMap.size, 0);
				}
			}
		}
	}
});
