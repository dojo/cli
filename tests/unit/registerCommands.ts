const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { stub, SinonStub } from 'sinon';
import { getCommandsMap, getYargsStub, GroupDef } from '../support/testHelper';
import MockModule from '../support/MockModule';

import * as defaultCommandWrapper from '../support/test-prefix-foo-bar';

const groupDef: GroupDef = [
	{
		groupName: 'group1',
		commands: [{ commandName: 'command1' }]
	},
	{
		groupName: 'group2',
		commands: [{ commandName: 'command1' }, { commandName: 'command2' }]
	}
];

let mockModule: MockModule;
let commandsMap: any;
let yargsStub: any;
let defaultRegisterStub: SinonStub;
let defaultRunStub: SinonStub;
let consoleErrorStub: SinonStub;
let consoleWarnStub: SinonStub;
let processExitStub: SinonStub;
let configurationSetStub: SinonStub;
const errorMessage = 'test error message';
let registerCommands: any;

function createYargsCommandNames(obj: any): Map<string, Set<any>> {
	const map = new Map();
	for (let key in obj) {
		map.set(key, obj[key]);
	}
	return map;
}

registerSuite('registerCommands', {
	beforeEach() {
		mockModule = new MockModule('../../src/registerCommands', require);
		mockModule.dependencies(['./configurationHelper']);
		registerCommands = mockModule.getModuleUnderTest().default;
		yargsStub = getYargsStub();
		commandsMap = getCommandsMap(groupDef);
		processExitStub = stub(process, 'exit');
		configurationSetStub = stub();
	},

	afterEach() {
		processExitStub.restore();
		process.argv = [];
		mockModule.destroy();
	},

	tests: {
		'Should setup correct yargs arguments'() {
			const yargsArgs = ['demand', 'usage', 'epilog', 'help', 'strict'];
			registerCommands(yargsStub, commandsMap, new Map());
			yargsArgs.forEach((arg) => {
				assert.isTrue(yargsStub[arg].calledOnce);
			});
			assert.isTrue(yargsStub.alias.calledOnce, 'Should be called for help aliases');
		},
		'Should call strict for all commands'() {
			registerCommands(
				yargsStub,
				commandsMap,
				createYargsCommandNames({
					group1: new Set(['group1-command1']),
					group2: new Set(['group2-command1', 'group2-command2'])
				})
			);
			assert.equal(yargsStub.strict.callCount, 4);
		},
		'Should call yargs.command once for each yargsCommandName passed and once for the default command'() {
			const key = 'group1-command1';
			const { group, description } = commandsMap.get(key);
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
			assert.isTrue(yargsStub.command.calledTwice);
			assert.isTrue(yargsStub.command.firstCall.calledWith(group, description), 'First call is for parent');
			assert.isTrue(yargsStub.command.secondCall.calledWith('command1', key), 'Second call is sub-command');
		},
		'Should run the passed command when yargs called with group name and command'() {
			const key = 'group1-command1';
			const { run } = commandsMap.get(key);
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
			yargsStub.command.secondCall.args[3]({});
			assert.isTrue(run.calledOnce);
		},
		'Should call into register method'() {
			const key = 'group1-command1';
			registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
			assert.isTrue(yargsStub.option.called);
		},

		'command arguments': {
			'pass dojo rc config as run arguments'() {
				const key = 'group1-command1';
				const { run } = commandsMap.get(key);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return { foo: 'bar' };
							}
						};
					}
				};

				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
				yargsStub.command.secondCall.args[3]({});
				assert.isTrue(run.calledOnce);
				assert.deepEqual(run.firstCall.args[1], { foo: 'bar' });
			},

			'command line args should override dojo rc config'() {
				const key = 'group1-command1';
				process.argv = ['-foo'];
				const { run } = commandsMap.get(key);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return { foo: 'bar' };
							}
						};
					}
				};

				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
				yargsStub.command.secondCall.args[3]({ foo: 'foo' });
				assert.isTrue(run.calledOnce);
				assert.deepEqual(run.firstCall.args[1], { foo: 'foo' });
			},

			'default command line args should not override dojo rc config'() {
				const key = 'group1-command1';
				const { run } = commandsMap.get(key);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return { foo: 'bar' };
							}
						};
					}
				};

				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
				yargsStub.command.secondCall.args[3]({ foo: 'foo' });
				assert.isTrue(run.calledOnce);
				assert.deepEqual(run.firstCall.args[1], { foo: 'bar' });
			},

			'command line options aliases should override dojo rc config'() {
				const key = 'group1-command1';
				process.argv = ['-f'];
				yargsStub = getYargsStub({ foo: ['f'], f: ['foo'] });
				const { run } = commandsMap.get(key);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return { foo: 'bar' };
							}
						};
					}
				};

				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
				yargsStub.command.secondCall.args[3]({ f: 'foo', foo: 'foo' });
				assert.isTrue(run.calledOnce);
				assert.deepEqual(run.firstCall.args[1], { foo: 'foo', f: 'foo' });
			},

			'should use rc config value for option aliases'() {
				const key = 'group1-command1';
				yargsStub = getYargsStub({ foo: ['f'], f: ['foo'] });
				const { run } = commandsMap.get(key);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return { foo: 'bar' };
							}
						};
					}
				};

				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
				yargsStub.command.secondCall.args[3]({ f: 'foo', foo: 'foo' });
				assert.isTrue(run.calledOnce);
				assert.deepEqual(run.firstCall.args[1], { foo: 'bar', f: 'bar' });
			},

			'should use default command line arguments when not provided in config'() {
				const key = 'group1-command1';
				yargsStub = getYargsStub({ foo: ['f'], f: ['foo'] });
				const { run } = commandsMap.get(key);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return {};
							}
						};
					}
				};

				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
				yargsStub.command.secondCall.args[3]({ f: 'foo', foo: 'foo' });
				assert.isTrue(run.calledOnce);
				assert.deepEqual(run.firstCall.args[1], { foo: 'foo', f: 'foo' });
			}
		},

		'save configuration': {
			'should write arguments to dojorc when save is passed'() {
				const key = 'group1-command1';
				process.argv = ['-foo'];
				const { run } = commandsMap.get(key);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return { foo: 'bar' };
							},
							set: configurationSetStub
						};
					}
				};

				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
				yargsStub.command.secondCall.args[3]({ bar: 'bar', foo: 'foo', save: true });
				assert.isTrue(run.calledOnce);
				assert.deepEqual(run.firstCall.args[1], { bar: 'bar', foo: 'foo' });
				assert.isTrue(configurationSetStub.calledWith({ foo: 'foo' }));
			}
		},
		alias: {
			beforeEach() {
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
				consoleWarnStub = stub(console, 'warn');
			},

			afterEach() {
				consoleWarnStub.restore();
			},

			tests: {
				'should register add itself as a command'() {
					registerCommands(
						yargsStub,
						commandsMap,
						createYargsCommandNames({ group1: new Set(['group1-command1']) })
					);
					assert.equal(yargsStub.command.thirdCall.args[0], 'alias');
					assert.equal(yargsStub.command.thirdCall.args[1], 'some description');
				},
				'should register options'() {
					registerCommands(
						yargsStub,
						commandsMap,
						createYargsCommandNames({ group1: new Set(['group1-command1']) })
					);
					assert.isTrue(yargsStub.option.calledThrice);
				},
				'should not register provided options'() {
					const key = 'group1-command1';
					const command = commandsMap.get(key);
					(command.register = stub()
						.callsArgWith(0, 'w', {})
						.returns(key)),
						registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
					assert.isTrue(yargsStub.option.calledTwice);
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
					registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
					assert.isTrue(yargsStub.option.calledThrice);
				},
				'should augment argv when run'() {
					const key = 'group1-command1';
					const command = commandsMap.get(key);
					registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
					yargsStub.command.thirdCall.args[3]({ _: ['group', 'command'] });
					assert.equal(command.run.firstCall.args[1].w, 10);
				},
				'should warn that command line options cannot be saved for aliases'() {
					const key = 'group1-command1';
					const command = commandsMap.get(key);
					registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
					yargsStub.command.thirdCall.args[3]({ _: ['group', 'command'], save: true });
					assert.isTrue(command.run.calledOnce);
					assert.isTrue(consoleWarnStub.calledWith('Save is not supported with for command aliases'));
				},
				'should run without options'() {
					const key = 'group1-command1';
					const command = commandsMap.get(key);
					command.alias = [
						{
							name: 'alias'
						}
					];
					registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
					yargsStub.command.thirdCall.args[3]({ _: ['group', 'command'] });
					const properties = Object.keys(command.run.firstCall.args[1]);
					assert.equal(properties.length, 1);
					['group', 'command'].forEach((key) => {
						assert.notEqual(command.run.firstCall.args[1]._.indexOf(key), -1);
					});
				}
			}
		},
		'default command': {
			beforeEach() {
				const key = 'group1-command1';
				defaultRegisterStub = stub(defaultCommandWrapper, 'register')
					.callsArgWith(0, 'key', {})
					.returns(key);
				defaultRunStub = stub(defaultCommandWrapper, 'run').returns(Promise.resolve());
				commandsMap.set('group1', defaultCommandWrapper);
				const configurationHelper = mockModule.getMock('./configurationHelper');
				configurationHelper.default = {
					sandbox() {
						return {
							get() {
								return { foo: 'bar' };
							},
							set: configurationSetStub
						};
					}
				};
				registerCommands(yargsStub, commandsMap, createYargsCommandNames({ group1: new Set([key]) }));
			},
			afterEach() {
				defaultRegisterStub.restore();
				defaultRunStub.restore();
			},

			tests: {
				'Should register the default command'() {
					assert.isTrue(defaultRegisterStub.calledOnce);
				},
				'Should run default command when yargs called with only group name'() {
					yargsStub.command.firstCall.args[3]({ _: ['group'] });
					assert.isTrue(defaultRunStub.calledOnce);
				},
				'should write arguments to dojorc when save is passed'() {
					process.argv = ['-foo'];
					yargsStub.command.firstCall.args[3]({ _: ['group'], bar: 'bar', foo: 'foo', save: true });
					assert.isTrue(defaultRunStub.calledOnce);
					assert.isTrue(configurationSetStub.calledWith({ foo: 'foo' }));
				},
				'Should not run default command when yargs called with group name and command'() {
					yargsStub.command.firstCall.args[3]({ _: ['group', 'command'] });
					assert.isFalse(defaultRunStub.called);
				},
				'error message': {
					beforeEach() {
						consoleErrorStub = stub(console, 'error');
						defaultRunStub.returns(Promise.reject(new Error(errorMessage)));
					},
					afterEach() {
						consoleErrorStub.restore();
					},

					tests: {
						async 'Should show error message if the run command rejects'() {
							await yargsStub.command.firstCall.args[3]({ _: ['group'] });
							assert.isTrue(consoleErrorStub.calledOnce);
							assert.isTrue(consoleErrorStub.firstCall.calledWithMatch(errorMessage));
							assert.isTrue(processExitStub.called);
						}
					}
				},
				'status codes call process exit': (function() {
					return {
						tests: {
							async 'Should exit process with exitCode of 1 when no exitCode is returned'() {
								defaultRunStub.returns(Promise.reject(new Error(errorMessage)));

								await yargsStub.command.firstCall.args[3]({ _: ['group'] });
								assert.isTrue(processExitStub.calledOnce);
								assert.isTrue(processExitStub.calledWith(1));
							},
							async 'Should exit process if status code is returned'() {
								defaultRunStub.returns(
									Promise.reject({
										message: errorMessage,
										exitCode: 1
									})
								);

								await yargsStub.command.firstCall.args[3]({ _: ['group'] });
								assert.isTrue(processExitStub.called);
							}
						}
					};
				})()
			}
		}
	}
});
