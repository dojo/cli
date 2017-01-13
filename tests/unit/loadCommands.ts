import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { stub, SinonStub } from 'sinon';
import { getCommandWrapper, getYargsStub } from '../support/testHelper';
import { join, resolve as pathResolve } from 'path';
import { Config } from '../../src/config';
const enumBuiltInCommands = require('intern/dojo/node!../../src/loadCommands').enumerateBuiltInCommands;
const enumInstalledCommands = require('intern/dojo/node!../../src/loadCommands').enumerateInstalledCommands;
const loadCommands = require('intern/dojo/node!../../src/loadCommands').loadCommands;

let loadStub: SinonStub;
let yargsStub: any;
let commandWrapper1: any;
let commandWrapper2: any;
let consoleStub: SinonStub;
let goodConfig: Config;

function config(invalid: boolean): Config {
	// tests are run in package-dir (from cli, using grunt test) - FIX to use pkg-dir
	const config: Config = {
		searchPaths: [ '_build/tests/support' ],
		searchPrefixes: [ 'test-prefix' ],
		builtInCommandLocation: join(pathResolve('.'), '/_build/tests/support/commands')
	};
	const badConfig: Config = {
		searchPaths: [ 'just/garbage', 'yep/really/bad/paths/here' ],
		searchPrefixes: [ 'bad-prefix' ],
		builtInCommandLocation : 'dirThatDoesNotExist'
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
		goodConfig = config(false);
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
			goodConfig = config(false);
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
	}

});
