import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { stub, SinonStub } from 'sinon';
import { getCommandWrapper, getYargsStub } from '../support/testHelper';
const loadCommands = require('intern/dojo/node!../../src/loadCommands').default;

const config = {
	searchPaths: [ '_build/tests/support' ],
	searchPrefix: 'test-prefix'
};

let loadStub: SinonStub;
let yargsStub: any;
let commandWrapper1: any;
let commandWrapper2: any;

registerSuite({
	name: 'loadCommands',
	'beforeEach'() {
			commandWrapper1 = getCommandWrapper('command1');
			commandWrapper2 = getCommandWrapper('command2');
			yargsStub = getYargsStub();
			loadStub = stub();
	},
	'successful load': {
		'beforeEach'() {
			loadStub.onFirstCall().returns(commandWrapper1);
			loadStub.onSecondCall().returns(commandWrapper2);
		},
		async 'Should search given paths for prefixed command files'() {
			await loadCommands(yargsStub, config, loadStub);
			assert.isTrue(loadStub.calledTwice);
			const loadPath = loadStub.firstCall.args[0];
			assert.isTrue(loadPath.indexOf(config.searchPaths[0]) > -1);
			assert.isTrue(loadPath.indexOf(config.searchPrefix) > -1);
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
		const consoleStub = stub(console, 'error');
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
			consoleStub.restore();
		}
	}
});
