import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { stub, SinonStub } from 'sinon';
import { getCommandWrapper, getYargsStub } from '../support/testHelper';
import { join, resolve as pathResolve } from 'path';
const enumBuiltInCommands = require('intern/dojo/node!../../src/loadCommands').enumerateBuiltInCommands;
const enumInstalledCommands = require('intern/dojo/node!../../src/loadCommands').enumerateInstalledCommands;
const loadCommands = require('intern/dojo/node!../../src/loadCommands').loadCommands;

const config = {
	searchPaths: [ '_build/tests/support' ],
	searchPrefix: 'test-prefix'
};
const badConfig = {
	searchPaths: [ 'just/garbage', 'yep/really/bad/paths/here' ],
	searchPrefix: 'bad-prefix'
};

let loadStub: SinonStub;
let yargsStub: any;
let commandWrapper1: any;
let commandWrapper2: any;
let consoleStub: SinonStub;

registerSuite({
	name: 'loadCommands',
	'beforeEach'() {
		consoleStub = stub(console, 'error');
		commandWrapper1 = getCommandWrapper('command1');
		commandWrapper2 = getCommandWrapper('command2');
		yargsStub = getYargsStub();
		loadStub = stub();
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
			const installedPaths = await enumInstalledCommands(config);
			assert.isTrue(installedPaths.length === 2);
		},
		async 'Should successfully enumerate builtin commands'() {
			// tests are run in package-dir
			const testFixtureDirForCommands = join(pathResolve('.'), '/_build/tests/support/commands');
			const builtInPaths = await enumBuiltInCommands(testFixtureDirForCommands);
			assert.isTrue(builtInPaths.length === 1);
		}
	},
	'unsuccessful enumeration': {
		async 'Should fail to find installed commands that dont exist'() {
			config.searchPrefix = 'bad-prefix';
			const badPrefixPaths = await enumInstalledCommands(config);
			assert.isTrue(badPrefixPaths.length === 0);

			const badInstalledPaths = await enumInstalledCommands(badConfig);
			assert.isTrue(badInstalledPaths.length === 0);
		},
		async 'Should fail to find built in commands that dont exist'() {
			const badBuiltInPaths = await enumBuiltInCommands('dirThatDoesNotExist');
			assert.isTrue(badBuiltInPaths.length === 0);
		}
	},
	'successful load': {
		'beforeEach'() {
			loadStub.onFirstCall().returns(commandWrapper1);
			loadStub.onSecondCall().returns(commandWrapper2);
		},
		async 'Should set first loaded command of each group to be the default'() {
			const { commandsMap } = await loadCommands(yargsStub, config, loadStub);
			assert.isTrue(loadStub.calledTwice);
			assert.equal(3, commandsMap.size);
			assert.equal(commandWrapper1, commandsMap.get(commandWrapper1.group));
			assert.equal(commandWrapper1, commandsMap.get(`${commandWrapper1.group}-${commandWrapper1.name}`));
		}
	},
	async 'failed load'() {
		const failConfig = {
			searchPaths: [ '_build/tests/support' ],
			searchPrefix: 'esmodule-fail'
		};
		loadStub.onFirstCall().throws();

		try {
			await loadCommands(yargsStub, failConfig, loadStub);
		}
		catch (error) {
			assert.isTrue(error instanceof Error);
			assert.isTrue(error.message.indexOf('Failed to load module') > -1);
		}
	},
	async 'should apply loading precedence to duplicate commands'() {
		const duplicateCommandName = 'command1';
		const duplicateGroupName = 'foo';
		const commandWrapperDuplicate = getCommandWrapper(duplicateCommandName);
		loadStub.onFirstCall().returns(commandWrapper1);
		loadStub.onSecondCall().returns(commandWrapperDuplicate);

		const { yargsCommandNames } = await loadCommands(yargsStub, config, loadStub);
		assert.isTrue(loadStub.calledTwice);
		const groupCommandSet = yargsCommandNames[ duplicateGroupName ];

		assert.equal(1, groupCommandSet.size);
		assert.isTrue(groupCommandSet.has(`${duplicateGroupName}-${duplicateCommandName}`));
	}

});
