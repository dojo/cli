import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as yargs from 'yargs';
import { stub, SinonStub } from 'sinon';
import { getCommandsMap, GroupDef } from '../support/testHelper';
const register = require('intern/dojo/node!../../src/register');

const config = {
	searchPaths: [ 'test-path' ],
	searchPrefix: 'test-prefix'
};

let loadStub: SinonStub;
let yargsStub: SinonStub;

// let commandWrapper: any;
const groupDef: GroupDef = [
	{
		groupName: 'group1',
		commands: [ { commandName: 'command1' } ]
	},
	{
		groupName: 'group2',
		commands: [ { commandName: 'command1' } ]
	}
];
const commandsMap = getCommandsMap(groupDef);

registerSuite({
	name: 'register',
	'beforeEach'() {
		yargsStub = stub(yargs);
		loadStub = stub();
	},
	'afterEach'() {
		yargsStub.restore();
		loadStub.restore();
	},
	'Should search given paths for prefixed command files'() {
		register.register(config, yargs, loadStub);
		assert.isTrue(commandsMap);
	}
});
