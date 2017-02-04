import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { stub, SinonStub } from 'sinon';
import { getCommandsMap, getYargsStub, GroupDef } from '../support/testHelper';

const { 'default': registerCommands } = require('intern/dojo/node!../../src/registerCommands');
const defaultCommandWrapper = require('intern/dojo/node!../support/test-prefix-foo-bar');

const groupDef: GroupDef = [
	{
		groupName: 'group1',
		commands: [ { commandName: 'command1' } ]
	},
	{
		groupName: 'group2',
		commands: [ { commandName: 'command1' }, { commandName: 'command2' }  ]
	}
];
let commandsMap: any;
let yargsStub: any;
let defaultRegisterStub: SinonStub;
let defaultRunStub: SinonStub;
let consoleErrorStub: SinonStub;
const errorMessage = 'test error message';

function createYargsCommandNames(obj: any): Map<string, Set<any>> {
	const map = new Map();
	for ( let key in obj ) {
		map.set(key, obj[key]);
	}
	return map;
}

registerSuite({
	name: 'registerCommands',
	'beforeEach'() {
		yargsStub = getYargsStub();
		commandsMap = getCommandsMap(groupDef);
	},
	'Should setup correct yargs arguments'() {
		const yargsArgs = [ 'demand', 'usage', 'epilog', 'help', 'strict' ];
		registerCommands(yargsStub, commandsMap, new Map());
		yargsArgs.forEach((arg) => {
			assert.isTrue(yargsStub[arg].calledOnce);
		});
		assert.isTrue(yargsStub.alias.calledOnce, 'Should be called for help aliases');
	},
	'Should call strict for all commands'() {
		registerCommands(yargsStub, commandsMap, createYargsCommandNames({
			'group1': new Set([ 'group1-command1' ]),
			'group2': new Set([ 'group2-command1', 'group2-command2' ])
		}));
		assert.equal(yargsStub.strict.callCount, 4);
	},
	'Should call yargs.command once for each yargsCommandName passed and once for the default command'() {
		const key = 'group1-command1';
		const { group, description } = commandsMap.get(key);
		registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
		assert.isTrue(yargsStub.command.calledTwice);
		assert.isTrue(yargsStub.command.firstCall.calledWith(group, description), 'First call is for parent');
		assert.isTrue(yargsStub.command.secondCall.calledWith('command1', key), 'Second call is sub-command');
	},
	'Should run the passed command when yargs called with group name and command'() {
		const key = 'group1-command1';
		const { run } = commandsMap.get(key);
		registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
		yargsStub.command.secondCall.args[3]();
		assert.isTrue(run.calledOnce);
	},
	'Should call into register method'() {
		const key = 'group1-command1';
		registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
		assert.isTrue(yargsStub.option.called);
	},
	'alias': {
		'beforeEach'() {
			const command = commandsMap.get('group1-command1');
			command.alias = {
				name: 'alias',
				description: 'some description',
				options: [
					{
						option: 'w',
						value: 10
					}
				]
			};
		},
		'should register add itself as a command'() {
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ 'group1-command1' ])}));
			assert.equal(yargsStub.command.thirdCall.args[0], 'alias');
			assert.equal(yargsStub.command.thirdCall.args[1], 'some description');
		},
		'should register options'() {
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ 'group1-command1' ])}));
			assert.isTrue(yargsStub.option.calledTwice);
		},
		'should not register provided options'() {
			const key = 'group1-command1';
			const command = commandsMap.get(key);
			command.register = stub().callsArgWith(0, 'w', {}).returns(key),
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
			assert.isTrue(yargsStub.option.calledOnce);
		},
		'should register when alias is an array'() {
			const key = 'group1-command1';
			const command = commandsMap.get(key);
			command.alias = [
				{
					name: 'alias',
					options: [
						{
							option: 'w',
							value: 10
						}
					]
				}
			];
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
			assert.isTrue(yargsStub.option.calledTwice);
		},
		'should augment argv when run'() {
			const key = 'group1-command1';
			const command = commandsMap.get(key);
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
			yargsStub.command.thirdCall.args[3]({'_': ['group', 'command']});
			assert.equal(command.run.firstCall.args[1].w, 10);
		},
		'should run without options'() {
			const key = 'group1-command1';
			const command = commandsMap.get(key);
			command.alias = [
				{
					name: 'alias'
				}
			];
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
			yargsStub.command.thirdCall.args[3]({'_': ['group', 'command']});
			const properties = Object.keys(command.run.firstCall.args[1]);
			assert.equal(properties.length, 1);
			['group', 'command'].forEach((key) => {
				assert.notEqual(command.run.firstCall.args[1]._.indexOf(key), -1);
			});
		}
	},
	'default command': {
		'beforeEach'() {
			const key = 'group1-command1';
			defaultRegisterStub = stub(defaultCommandWrapper, 'register').callsArgWith(0, 'key', {}).returns(key);
			defaultRunStub = stub(defaultCommandWrapper, 'run').returns(Promise.resolve());
			commandsMap.set('group1', defaultCommandWrapper);
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({'group1': new Set([ key ])}));
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
		},
		'error message': {
			'beforeEach'() {
				consoleErrorStub = stub(console, 'error');
				defaultRunStub.returns(Promise.reject(new Error(errorMessage)));
			},
			'afterEach'() {
				consoleErrorStub.restore();
			},
			async 'Should show error message if the run command rejects'() {
				await yargsStub.command.firstCall.args[3]({'_': ['group']});
				assert.isTrue(consoleErrorStub.calledOnce);
				assert.isTrue(consoleErrorStub.firstCall.calledWithMatch(errorMessage));
			}
		}
	}
});
