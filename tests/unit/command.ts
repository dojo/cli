const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { getCommandsMap, GroupDef } from '../support/testHelper';
import * as command from '../../src/command';

import * as expectedCommand from '../support/test-prefix-foo-bar';

import * as expectedBuiltInCommand from '../support/commands/test-prefix-foo-bar';
import expectedEsModuleCommand from '../support/esmodule-prefix-foo-bar';

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

registerSuite('command', {
	'load': {
		'beforeEach'() {
			loader = command.initCommandLoader(testSearchPrefixes);
			commandWrapper = loader(getCommandPath(testSearchPrefixes)[0]);
		},

		tests: {
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
		}
	},
	'load built in command': {
		'beforeEach'() {
			loader = command.createBuiltInCommandLoader();
			commandWrapper = loader(getBuiltInCommandPath(false));
		},

		tests: {
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
		}
	},
	'load esmodule default': {
		'beforeEach'() {
			loader = command.initCommandLoader(testEsModuleSearchPrefixes);
			commandWrapper = loader(getCommandPath(testEsModuleSearchPrefixes)[0]);
		},

		tests: {
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
		}
	},
	'load esmodule that does not meet Command interface': {
		'before'() {
			loader = command.initCommandLoader(testEsModuleFailSearchPrefixes);
		},

		tests: {
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
		}
	},
	'load builtin command that does not meet Command interface': {
		'before'() {
			loader = command.createBuiltInCommandLoader();
		},

		tests: {
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
		}
	},
	'load of commands parsed correctly': {
		'before'() {
			loader = command.initCommandLoader(testSearchPrefixesDashedNames);
			commandWrapper = loader('../tests/support/dash-names-foo-bar-baz');
		},

		tests: {
			'Should parse group names correctly'() {
				assert.equal('foo', commandWrapper.group);
				assert.equal('bar-baz', commandWrapper.name);
			}
		}
	},
	'getGroupDescription': {
		'before'() {
			loader = command.initCommandLoader(testSearchPrefixes);
		},

		tests: {
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
	}
});
