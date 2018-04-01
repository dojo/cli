const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { SinonStub, stub } from 'sinon';
import * as mockery from 'mockery';
import { getGroupMap, GroupDef } from '../support/testHelper';
import configurationHelperFactory from '../../src/configurationHelper';

const groupDef: GroupDef = [
	{
		groupName: 'group1',
		commands: [{ commandName: 'command1' }]
	},
	{
		groupName: 'group2',
		commands: [{ commandName: 'command1' }, { commandName: 'failcommand', fails: true }]
	}
];
let groupMap: any;
let commandHelper: any;
const templateStub: SinonStub = stub();

const context = {
	testKey: 'testValue'
};

registerSuite('CommandHelper', {
	beforeEach() {
		templateStub.reset();
		mockery.enable({ warnOnUnregistered: false, useCleanCache: true });

		mockery.registerMock('./template', {
			default: templateStub
		});

		groupMap = getGroupMap(groupDef);
		const commandHelperCtor = require('../../src/CommandHelper').default;
		commandHelper = new commandHelperCtor(groupMap, context, configurationHelperFactory);
	},

	afterEach() {
		mockery.deregisterAll();
		mockery.disable();
	},
	tests: {
		'Should set commandsMap and context'() {
			assert.strictEqual(groupMap, commandHelper._groupMap);
			assert.strictEqual(context, commandHelper._context);
		},
		'Should return exists = true when a queried command exists'() {
			assert.isTrue(commandHelper.exists('group1', 'command1'));
		},
		'Should accept composite key for query and return exists = true when a command exists'() {
			assert.isTrue(commandHelper.exists('group1'));
		},
		'Should return exists = false when a queried command does not exist'() {
			assert.isFalse(commandHelper.exists('group3', 'command3'));
		},
		'Should run a command that exists and return a promise that resolves'() {
			const key = 'group1-command1';
			return commandHelper
				.run('group1', 'command1')
				.then((response: string) => {
					assert.equal(key, response);
				})
				.catch(() => {
					assert.fail(null, null, 'commandHelper.run should not have rejected promise');
				});
		},
		'Should run a command that exists with args and return a promise that resolves'() {
			const key = 'group1-command1';
			return commandHelper
				.run('group1', undefined, 'args')
				.then((response: string) => {
					const mockCommand = groupMap.get('group1')!.get('command1')!;
					assert.isTrue(mockCommand.runSpy.called);
					assert.equal(mockCommand.runSpy.getCall(0).args[1], 'args');
					assert.equal(key, response);
				})
				.catch(() => {
					assert.fail(null, null, 'commandHelper.run should not have rejected promise');
				});
		},
		'Should run a command that exists and return a rejected promise when it fails'() {
			return commandHelper
				.run('group2', 'failcommand')
				.then(
					(response: string) => {
						assert.fail(null, null, 'Should not have resolved');
					},
					(error: Error) => {
						assert.equal('test error message', error.message);
					}
				)
				.catch(() => {
					assert.fail(null, null, 'commandHelper.run should not have rejected promise');
				});
		},
		'Should not run a command that does not exist and return a rejected promise'() {
			const expectedErrorMsg = 'The command does not exist';
			return commandHelper
				.run('nogroup', 'nocommand')
				.then(
					(response: string) => {
						assert.fail(null, null, 'Should not have resolved');
					},
					(error: Error) => {
						assert.equal(expectedErrorMsg, error.message);
					}
				)
				.catch(() => {
					assert.fail(null, null, 'commandHelper.run should not have rejected promise');
				});
		},
		'Should call template for each file in the config'() {
			const testRenderData = {
				appName: 'testName'
			};

			const testFilesConfig = [{ src: 'test/a', dest: 'dest/a' }, { src: 'test/b', dest: 'dest/b' }];

			commandHelper.renderFiles(testFilesConfig, testRenderData);
			assert.equal(2, templateStub.callCount);
		},
		'Should call template with the src and dest from config'() {
			const testRenderData = {
				appName: 'testName'
			};

			const testFilesConfig = [{ src: 'test/a', dest: 'dest/a' }, { src: 'test/b', dest: 'dest/b' }];

			commandHelper.renderFiles(testFilesConfig, testRenderData);
			const [file1, file2] = testFilesConfig;
			assert.isTrue(templateStub.firstCall.calledWithMatch(file1.src, file1.dest));
			assert.isTrue(templateStub.secondCall.calledWithMatch(file2.src, file2.dest));
		}
	}
});
