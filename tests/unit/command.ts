import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { getCommandsMap, GroupDef } from '../support/testHelper';
import * as UnitUnderTest from '../../src/command';

const command: typeof UnitUnderTest = require('intern/dojo/node!../../src/command');
const expectedCommand = require('intern/dojo/node!../support/test-prefix-foo-bar');
const expectedBuiltInCommand = require('intern/dojo/node!../support/commands/test-prefix-foo-bar');
const expectedEsModuleCommand = require('intern/dojo/node!../support/esmodule-prefix-foo-bar').default;
const expectedExplicitCommand = require('intern/dojo/node!../support/cli-test-command').default;
const expectedNamelessExplicitCommand = require('intern/dojo/node!../support/cli-nameless-command').default;

const testGroup = 'foo';
const testName = 'bar';
const testSearchPrefixes = [ 'test-prefix' ];
const testEsModuleSearchPrefixes = [ 'esmodule-prefix' ];
const testEsModuleFailSearchPrefixes = [ 'esmodule-fail' ];
const testSearchPrefixesDashedNames = [ 'dash-names' ];
let commandWrapper: any;
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
let loader: any;

function getCommandPath(prefixes: string[]): string[] {
	return prefixes.map((prefix) => {
		return `../tests/support/${prefix}-${testGroup}-${testName}`;
	});
}

function getBuiltInCommandPath(invalid: boolean): string {
	return invalid ? `../tests/support/commands/invalid-built-in-command` : `../tests/support/commands/test-prefix-foo-bar`;
}

registerSuite({
	name: 'command',
	'load': {
		'beforeEach'() {
			loader = command.initCommandLoader(testSearchPrefixes);
			commandWrapper = loader(getCommandPath(testSearchPrefixes)[0]);
		},
		'Should get group and name from filename'() {
			assert.equal(testGroup, commandWrapper.group);
			assert.equal(testName, commandWrapper.name);
		},
		'Should get description from loaded file'() {
			assert.equal(expectedCommand.description, commandWrapper.description);
		},
		'Should get register function from loaded file'() {
			assert.equal(expectedCommand.register, commandWrapper.register);
		},
		'Should get run function from loaded file'() {
			assert.equal(expectedCommand.run, commandWrapper.run);
		}
	},
	'load built in command': {
		'beforeEach'() {
			loader = command.createBuiltInCommandLoader();
			commandWrapper = loader(getBuiltInCommandPath(false));
		},
		'Should get group, description and name loaded file'() {
			assert.equal(expectedBuiltInCommand.description, commandWrapper.description);
			assert.equal(expectedBuiltInCommand.description, commandWrapper.description);
			assert.equal(expectedBuiltInCommand.description, commandWrapper.description);
		},
		'Should get register function from loaded file'() {
			assert.equal(expectedBuiltInCommand.register, commandWrapper.register);
		},
		'Should get run function from loaded file'() {
			assert.equal(expectedBuiltInCommand.run, commandWrapper.run);
		}
	},
	'load esmodule default': {
		'beforeEach'() {
			loader = command.initCommandLoader(testEsModuleSearchPrefixes);
			commandWrapper = loader(getCommandPath(testEsModuleSearchPrefixes)[0]);
		},
		'Should get group and name from filename'() {
			assert.equal(testGroup, commandWrapper.group);
			assert.equal(testName, commandWrapper.name);
		},
		'Should get description from loaded file'() {
			assert.equal(expectedEsModuleCommand.description, commandWrapper.description);
		},
		'Should get register function from loaded file'() {
			assert.equal(expectedEsModuleCommand.register, commandWrapper.register);
		},
		'Should get run function from loaded file'() {
			assert.equal(expectedEsModuleCommand.run, commandWrapper.run);
		}
	},
	'load esmodule that does not meet Command interface': {
		'setup'() {
			loader = command.initCommandLoader(testEsModuleFailSearchPrefixes);
		},
		'Should throw an error when attempting to load'() {
			try {
				commandWrapper = loader(getCommandPath(testEsModuleFailSearchPrefixes)[0]);
				assert.fail(null, null, 'Should not get here');
			}
			catch (error) {
				assert.isTrue(error instanceof Error);
				assert.equal(error.message, `Path: ../tests/support/esmodule-fail-foo-bar returned module that does not satisfy the Command interface. Error: Module does not satisfy the Command interface`);
			}
		}
	},
	'load builtin command that does not meet Command interface': {
		'setup'() {
			loader = command.createBuiltInCommandLoader();
		},
		'Should throw an error when attempting to load'() {
			try {
				commandWrapper = loader(getBuiltInCommandPath(true));
				assert.fail(null, null, 'Should not get here');
			}
			catch (error) {
				assert.isTrue(error instanceof Error);
				assert.isTrue(error.message.indexOf('does not satisfy the Command interface') > -1);
			}
		}
	},
	'load explicit commands': {
		'beforeEach'() {
			loader = command.initExplicitCommandLoader();
			commandWrapper = loader('../tests/support/cli-test-command');
		},
		'Should get group and name from filename'() {
			commandWrapper = loader('../tests/support/cli-nameless-command');

			assert.equal('nameless', commandWrapper.group);
			assert.equal('command', commandWrapper.name);
			assert.equal(expectedNamelessExplicitCommand.description, commandWrapper.description);
		},
		'Should not error if filename is not the right format'() {
			commandWrapper = loader('../tests/support/test-prefix-foo-bar');
			assert.isUndefined(commandWrapper.group);
			assert.isUndefined(commandWrapper.name);
			assert.equal(expectedNamelessExplicitCommand.description, commandWrapper.description);
		},
		'Should get group, name, and description from loaded file'() {
			assert.equal(expectedExplicitCommand.group, commandWrapper.group);
			assert.equal(expectedExplicitCommand.name, commandWrapper.name);
			assert.equal(expectedExplicitCommand.description, commandWrapper.description);
		}
	},
	'load explicit command that does not meet command interface': {
		'setup'() {
			loader = command.initExplicitCommandLoader();
		},
		'Should throw an error when attempting to load'() {
			try {
				commandWrapper = loader(getBuiltInCommandPath(true));
				assert.fail(null, null, 'Should not get here');
			}
			catch (error) {
				assert.isTrue(error instanceof Error);
				assert.isTrue(error.message.indexOf('does not satisfy the Command interface') > -1);
			}
		}
	},
	'load of commands parsed correctly': {
		'setup'() {
			loader = command.initCommandLoader(testSearchPrefixesDashedNames);
			commandWrapper = loader('../tests/support/dash-names-foo-bar-baz');
		},
		'Should parse group names correctly'() {
			assert.equal('foo', commandWrapper.group);
			assert.equal('bar-baz', commandWrapper.name);
		}
	},
	'getGroupDescription': {
		'setup'() {
			loader = command.initCommandLoader(testSearchPrefixes);
		},
		'Should return simple command description when only one command name passed'() {
			const key = 'group1-command1';
			const description = command.getGroupDescription(new Set([key]), commandsMap);
			assert.equal(commandsMap.get(key).description, description);
		},
		'Should return composite description of sub commands when multiple command names passed'() {
			const key1 = 'group1-command1';
			const key2 = 'group2-command1';
			const description = command.getGroupDescription(new Set([key1, key2]), commandsMap);
			const expected = `${commandsMap.get(key1).name}  ${commandsMap.get(key1).description}\n${commandsMap.get(key1).name}  ${commandsMap.get(key2).description}`;

			assert.equal(expected, description);
		}
	}
});
