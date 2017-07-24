import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { join, resolve as pathResolve } from 'path';
import { stub, SinonStub, sandbox } from 'sinon';
import { Config } from '../../src/config';
import MockModule from '../support/MockModule';
import { getCommandWrapper, getYargsStub } from '../support/testHelper';
const enumBuiltInCommands = require('intern/dojo/node!../../src/loadCommands').enumerateBuiltInCommands;
const enumInstalledCommands = require('intern/dojo/node!../../src/loadCommands').enumerateInstalledCommands;
const enumExplicitCommands = require('intern/dojo/node!../../src/loadCommands').enumerateExplicitCommands;
const loadCommands = require('intern/dojo/node!../../src/loadCommands').loadCommands;

let loadStub: SinonStub;
let yargsStub: any;
let commandWrapper1: any;
let commandWrapper2: any;
let consoleStub: SinonStub;
let goodConfig: Config;
let mockModule: MockModule;
let mockedLoadCommands: any;
let testSandbox: any;

function config(invalid = false): Config {
	// tests are run in package-dir (from cli, using grunt test) - FIX to use pkg-dir
	const config: Config = {
		searchPaths: [ '_build/tests/support' ],
		searchPrefixes: [ 'test-prefix' ],
		builtInCommandLocation: join(pathResolve('.'), '/_build/tests/support/commands'),
		explicitCommands: []
	};
	const badConfig: Config = {
		searchPaths: [ 'just/garbage', 'yep/really/bad/paths/here' ],
		searchPrefixes: [ 'bad-prefix' ],
		builtInCommandLocation : 'dirThatDoesNotExist',
		explicitCommands: ['dirThatDoesNotExist']
	};

	return invalid ? badConfig : config;
}

registerSuite({
	name: 'loadCommands',
	'beforeEach'() {
		consoleStub = stub(console, 'error');
		commandWrapper1 = getCommandWrapper('command1');
		commandWrapper2 = getCommandWrapper('command2');
		yargsStub = getYargsStub();
		loadStub = stub();
		goodConfig = config();
	},
	'afterEach'() {
		consoleStub.restore();
	},
	'successful enumeration': {
		'beforeEach'() {
			loadStub.onFirstCall().returns(commandWrapper1);
			loadStub.onSecondCall().returns(commandWrapper2);
		},
		async 'Should successfully enumerate installed commands'() {
			const installedPaths = await enumInstalledCommands(goodConfig);
			assert.equal(installedPaths.length, 2);
		},
		async 'Should successfully enumerate builtin commands'() {
			const builtInPaths = await enumBuiltInCommands(goodConfig);
			assert.equal(builtInPaths.length, 2);   // includes invalid commands
		},
		async 'Should successfully enumerate explicit commands'() {
			const emptyPaths = await enumExplicitCommands(goodConfig);
			assert.equal(emptyPaths.length, 0);

			const singlePath = await enumExplicitCommands({...goodConfig, explicitCommands: ['/some/path']});
			assert.equal(singlePath.length, 1);
		}
	},
	'unsuccessful enumeration': {
		async 'Should fail to find installed commands that dont exist'() {
			goodConfig.searchPrefixes = [ 'bad-prefix' ];
			const badPrefixPaths = await enumInstalledCommands(goodConfig);
			assert.equal(badPrefixPaths.length, 0);

			const badInstalledPaths = await enumInstalledCommands(config((true)));
			assert.equal(badInstalledPaths.length, 0);
		},
		async 'Should fail to find built in commands that dont exist'() {
			const badBuiltInPaths = await enumBuiltInCommands(config(true));
			assert.equal(badBuiltInPaths.length, 0);
		}
	},
	'successful load': {
		'beforeEach'() {
			loadStub.onFirstCall().returns(commandWrapper1);
			loadStub.onSecondCall().returns(commandWrapper2);
			goodConfig = config();
		},
		async 'Should set first loaded command of each group to be the default'() {
			const installedPaths = await enumInstalledCommands(goodConfig);
			const { commandsMap } = await loadCommands(installedPaths, loadStub);

			assert.isTrue(loadStub.calledTwice);
			assert.equal(3, commandsMap.size);
			assert.equal(commandWrapper1, commandsMap.get(commandWrapper1.group));
			assert.equal(commandWrapper1, commandsMap.get(`${commandWrapper1.group}-${commandWrapper1.name}`));
		},
		async 'should apply loading precedence to duplicate commands'() {
			const duplicateCommandName = 'command1';
			const duplicateGroupName = 'foo';
			const commandWrapperDuplicate = getCommandWrapper(duplicateCommandName);
			loadStub.onFirstCall().returns(commandWrapper1);
			loadStub.onSecondCall().returns(commandWrapperDuplicate);

			const installedPaths = await enumInstalledCommands(goodConfig);
			const { yargsCommandNames } = await loadCommands(installedPaths, loadStub);

			assert.isTrue(loadStub.calledTwice);
			const groupCommandSet = yargsCommandNames.get(duplicateGroupName);

			assert.equal(1, groupCommandSet.size);
			assert.isTrue(groupCommandSet.has(`${duplicateGroupName}-${duplicateCommandName}`));
		}
	},
	'unsuccessful load': {
		async 'Should fail to load modules that dont satisfy the Command interface'() {
			const failConfig = {
				searchPaths: [ '_build/tests/support' ],
				searchPrefixes: [ 'esmodule-fail' ]
			};
			const installedPaths = await enumInstalledCommands(failConfig);

			loadStub.onFirstCall().throws();
			try {
				await loadCommands(installedPaths, loadStub);
			}
			catch (error) {
				assert.isTrue(error instanceof Error);
				assert.isTrue(error.message.indexOf('Failed to load module') > -1);
			}
		}
	},
	'ejected commands': {
		beforeEach() {
			testSandbox = sandbox.create();
			mockModule = new MockModule('../../src/loadCommands');
			mockModule.dependencies([
				'./configurationHelper'
			]);
			const configHelper = mockModule.getMock('./configurationHelper').default;
			testSandbox.stub(configHelper, 'sandbox', () => {
				return { get: testSandbox.stub().returns({ ejected: true }) };
			});
			mockedLoadCommands = mockModule.getModuleUnderTest().loadCommands;
		},
		afterEach() {
			mockModule.destroy();
			testSandbox.restore();
		},
		async 'Should not load rejected commands'() {
			loadStub.onFirstCall().returns(commandWrapper1);
			loadStub.onSecondCall().returns(commandWrapper2);
			goodConfig = config();

			const installedPaths = await enumInstalledCommands(goodConfig);
			const { commandsMap } = await mockedLoadCommands(installedPaths, loadStub);

			assert.equal(commandsMap.size, 0);
		}
	}
});
