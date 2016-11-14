import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { stub, SinonStub } from 'sinon';
import * as mockery from 'mockery';
import { getCommandsMap, getYargsStub, GroupDef } from '../support/testHelper';
import { versionRegisteredCommands } from '../../src/commands/version';

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

registerSuite({
	name: 'registerCommands',
	'setup'() {
		mockery.enable({
			warnOnUnregistered: false
		});

		mockery.registerMock('dirname', {'default': 'fakePackageRoot'});
	},
	'beforeEach'() {
		yargsStub = getYargsStub();
		commandsMap = getCommandsMap(groupDef);
	},
	'Should setup correct yargs arguments'() {
		const yargsArgs = [ 'demand', 'usage', 'epilog', 'help', 'strict' ];
		registerCommands(yargsStub, commandsMap, {});
		yargsArgs.forEach((arg) => {
			assert.isTrue(yargsStub[arg].calledOnce);
		});
		assert.isTrue(yargsStub.alias.calledTwice, 'Should be called for help and version aliases');
	},
	'Should call yargs.command once when no yargsCommandNames are passed'() {
		registerCommands(yargsStub, commandsMap, {});
		assert.isTrue(yargsStub.command.calledOnce);
	},
	'Should call strict for all commands'() {
		registerCommands(yargsStub, commandsMap, {
			'group1': new Set([ 'group1-command1' ]),
			'group2': new Set([ 'group2-command1', 'group2-command2' ])
		});
		assert.equal(yargsStub.strict.callCount, 4);
	},
	'Should call yargs.command once for each yargsCommandName passed and once for the default command'() {
		const key = 'group1-command1';
		const { group, description } = commandsMap.get(key);
		registerCommands(yargsStub, commandsMap, {'group1': new Set([ key ])});
		assert.isTrue(yargsStub.command.calledThrice);
		assert.isTrue(yargsStub.command.firstCall.calledWith(group, description), 'First call is for parent');
		assert.isTrue(yargsStub.command.secondCall.calledWith('command1', key), 'Second call is sub-command');
	},
	'Should run the passed command when yargs called with group name and command'() {
		const key = 'group1-command1';
		const { run } = commandsMap.get(key);
		registerCommands(yargsStub, commandsMap, {'group1': new Set([ key ])});
		yargsStub.command.secondCall.args[3]();
		assert.isTrue(run.calledOnce);
	},
	'default command': {
		'beforeEach'() {
			defaultRegisterStub = stub(defaultCommandWrapper, 'register');
			defaultRunStub = stub(defaultCommandWrapper, 'run').returns(Promise.resolve());
			commandsMap.set('group1', defaultCommandWrapper);
			const key = 'group1-command1';
			registerCommands(yargsStub, commandsMap, {'group1': new Set([ key ])});
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
	},
	'version': {
		'version option'() {
			commandsMap.set('group1', defaultCommandWrapper);
			const key = 'group1-command1';
			registerCommands(yargsStub, commandsMap, { 'group1': new Set([ key ]) });

			let versionString = yargsStub.version.lastCall.args[ 0 ]();

			assert.include(versionString, versionRegisteredCommands);
		},

		'version command'() {
			defaultRegisterStub = stub(defaultCommandWrapper, 'register');
			defaultRunStub = stub(defaultCommandWrapper, 'run').returns(Promise.resolve());
			commandsMap.set('group1', defaultCommandWrapper);
			const key = 'group1-command1';
			registerCommands(yargsStub, commandsMap, { 'group1': new Set([ key ]) });

			let output = '';
			let consoleStub = stub(console, 'log', function (...lines: string[]) {
				output += lines.join(' ');
			});

			yargsStub.command.lastCall.args[ 3 ]();

			consoleStub.restore();

			assert.isTrue(consoleStub.calledOnce);
			assert.include(output, versionRegisteredCommands);
		}
	}
});
