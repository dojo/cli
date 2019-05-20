const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as command from '../../src/command';

import * as expectedCommand from '../support/test-prefix-foo-bar';

import * as expectedBuiltInCommand from '../support/commands/test-prefix-foo-bar';
import expectedEsModuleCommand from '../support/esmodule-prefix-foo-bar';
import { CommandWrapper } from '../../src/interfaces';
import { getCommand } from '../../src/command';

const testGroup = 'foo';
const testName = 'bar';
const testSearchPrefixes = ['test-prefix'];
const testEsModuleSearchPrefixes = ['esmodule-prefix'];
const testEsModuleFailSearchPrefixes = ['esmodule-fail'];
const testSearchPrefixesDashedNames = ['dash-names'];
let commandWrapper: any;
let loader: any;

const groupMap = new Map();
const fooCommandMap = new Map<string, CommandWrapper>();
const defaultFooCommand = {
	name: 'global',
	group: 'foo',
	path: 'path/to/command',
	global: true,
	installed: true,
	description: 'a global command',
	default: true,
	register: () => {},
	run: () => Promise.resolve()
};
const nonDefaultFooCommand = {
	name: 'project',
	group: 'foo',
	path: 'path/to/command',
	global: false,
	installed: true,
	description: 'a project command',
	default: false,
	register: () => {},
	run: () => Promise.resolve()
};
fooCommandMap.set('global', defaultFooCommand);
fooCommandMap.set('project', nonDefaultFooCommand);
groupMap.set('foo', fooCommandMap);

function getCommandPath(prefixes: string[]): string[] {
	return prefixes.map((prefix) => {
		return `../tests/support/${prefix}-${testGroup}-${testName}`;
	});
}

function getBuiltInCommandPath(invalid: boolean): string {
	return invalid
		? `../tests/support/commands/invalid-built-in-command`
		: `../tests/support/commands/test-prefix-foo-bar`;
}

registerSuite('command', {
	load: {
		beforeEach() {
			process.argv = ['node', 'dojo.js', 'group'];
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
		beforeEach() {
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
		beforeEach() {
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
		before() {
			loader = command.initCommandLoader(testEsModuleFailSearchPrefixes);
		},

		tests: {
			'Should throw an error when attempting to load'() {
				try {
					commandWrapper = loader(getCommandPath(testEsModuleFailSearchPrefixes)[0]);
					assert.fail(null, null, 'Should not get here');
				} catch (error) {
					assert.isTrue(error instanceof Error);
					assert.equal(
						error.message,
						`Path: ../tests/support/esmodule-fail-foo-bar returned module that does not satisfy the Command interface. Error: Module does not satisfy the Command interface`
					);
				}
			}
		}
	},
	'load builtin command that does not meet Command interface': {
		before() {
			loader = command.createBuiltInCommandLoader();
		},

		tests: {
			'Should throw an error when attempting to load'() {
				try {
					commandWrapper = loader(getBuiltInCommandPath(true));
					assert.fail(null, null, 'Should not get here');
				} catch (error) {
					assert.isTrue(error instanceof Error);
					assert.isTrue(error.message.indexOf('does not satisfy the Command interface') > -1);
				}
			}
		}
	},
	'load of commands parsed correctly': {
		before() {
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
	'dont load commands if passing help': {
		before() {
			process.argv = ['node', 'dojo.js', '--help'];
			loader = command.initCommandLoader(testSearchPrefixesDashedNames);
			commandWrapper = loader('../tests/support/dash-names-foo-bar-baz');
		},
		tests: {
			'Should use the package description and mock command correctly'() {
				assert.equal('a test command package', commandWrapper.description);
				assert.isUndefined(commandWrapper.register());
				assert.isUndefined(commandWrapper.run());
				assert.isUndefined(commandWrapper.eject());
				assert.isUndefined(commandWrapper.validate());
			}
		}
	},
	getCommand: {
		'should return command'() {
			const command = getCommand(groupMap, 'foo', 'project');
			assert.strictEqual(command, nonDefaultFooCommand);
		},
		'should return default command for group'() {
			const command = getCommand(groupMap, 'foo');
			assert.strictEqual(command, defaultFooCommand);
		},
		'should throw an error when the group does not exist'() {
			assert.throws(() => getCommand(groupMap, 'fake'), /Unable to find command group: fake/);
		},
		'should throw an error when the command does not exist'() {
			assert.throws(() => getCommand(groupMap, 'foo', 'fake'), /Unable to find command: fake for group: foo/);
		}
	}
});
