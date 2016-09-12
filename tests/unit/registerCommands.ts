import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { getCommandsMap, getYargsStub, GroupDef } from '../support/testHelper';
const registerCommands = require('intern/dojo/node!../../src/registerCommands').default;

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
let yargsStub: any;

registerSuite({
	name: 'registerCommands',
	'beforeEach'() {
		yargsStub = getYargsStub();
	},
	'Should setup correct yargs arguments'() {
		const yargsArgs = ['usage', 'epilog', 'help'];
		registerCommands(yargsStub, commandsMap, {});
		yargsArgs.forEach((arg) => {
			assert.isTrue(yargsStub[arg].calledOnce);
		});
		assert.isTrue(yargsStub.alias.calledTwice, 'Should be called for help and version aliases');
	},
	'Should not call yargs.command when no yargsCommandNames are passed'() {
		registerCommands(yargsStub, commandsMap, {});
		assert.isFalse(yargsStub.command.called);
	},
	'Should call yargs.command once for each yargsCommandName passed'() {
		const key = 'group1-command1';
		const { group, description } = commandsMap.get(key);
		registerCommands(yargsStub, commandsMap, {'group1': [ key ]});
		assert.isTrue(yargsStub.command.calledTwice);
		assert.isTrue(yargsStub.command.firstCall.calledWith(group, description), 'First call is for parent');
		assert.isTrue(yargsStub.command.secondCall.calledWith('command1', key), 'Second call is sub-command');
	}
});
