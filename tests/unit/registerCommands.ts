import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { stub, SinonStub } from 'sinon';
import { getCommandsMap, getYargsStub, GroupDef } from '../support/testHelper';
const registerCommands = require('intern/dojo/node!../../src/registerCommands').default;
const defaultCommandWrapper = require('intern/dojo/node!../support/test-prefix-foo-bar');

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
let commandsMap: any;
let yargsStub: any;
let defaultRegisterStub: SinonStub;
let defaultRunStub: SinonStub;

registerSuite({
	name: 'registerCommands',
	'beforeEach'() {
		yargsStub = getYargsStub();
		commandsMap = getCommandsMap(groupDef);
	},
	'Should setup correct yargs arguments'() {
		const yargsArgs = ['demand', 'usage', 'epilog', 'help'];
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
	'Should call yargs.command once for each yargsCommandName passed and once for the default command'() {
		const key = 'group1-command1';
		const { group, description } = commandsMap.get(key);
		registerCommands(yargsStub, commandsMap, {'group1': [ key ]});
		assert.isTrue(yargsStub.command.calledTwice);
		assert.isTrue(yargsStub.command.firstCall.calledWith(group, description), 'First call is for parent');
		assert.isTrue(yargsStub.command.secondCall.calledWith('command1', key), 'Second call is sub-command');
	},
	'Should run the passed command when yargs called with group name and command'() {
		const key = 'group1-command1';
		const { run } = commandsMap.get(key);
		registerCommands(yargsStub, commandsMap, {'group1': [ key ]});
		yargsStub.command.secondCall.args[3]();
		assert.isTrue(run.calledOnce);
	},
	'default command': {
		'beforeEach'() {
			defaultRegisterStub = stub(defaultCommandWrapper, 'register');
			defaultRunStub = stub(defaultCommandWrapper, 'run').returns(Promise.resolve());
			commandsMap.set('group1', defaultCommandWrapper);
			const key = 'group1-command1';
			registerCommands(yargsStub, commandsMap, {'group1': [ key ]});
		},
		'afterEach'() {
			defaultRegisterStub.restore();
			defaultRunStub .restore();
		},
		'Should register the default command'() {
			assert.isTrue(defaultRegisterStub.calledOnce);
		},
		'Should run default command when yargs called with only group name'() {
			yargsStub.command.firstCall.args[3]({'_': ['group']});
			assert.isTrue(defaultRunStub.calledOnce);
		},
		'Should not run default command when yargs called with group name and command'() {
			yargsStub.command.firstCall.args[3]({'_': ['group', 'command']});
			assert.isFalse(defaultRunStub.called);
		}
	}
});
