import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { getCommandsMap, GroupDef } from '../support/testHelper';
import configurationHelperFactory from '../../src/configurationHelper';
const commandHelperCtor = require('intern/dojo/node!../../src/CommandHelper').default;

const groupDef: GroupDef = [
	{
		groupName: 'group1',
		commands: [ { commandName: 'command1' } ]
	},
	{
		groupName: 'group2',
		commands: [
			{ commandName: 'command1' },
			{ commandName: 'failcommand', fails: true }
		]
	}
];
let commandsMap: any;
let commandHelper: any;
const context = {
	'testKey': 'testValue'
};

registerSuite({
	name: 'CommandHelper',
	'beforeEach'() {
		commandsMap = getCommandsMap(groupDef);
		commandHelper = new commandHelperCtor(commandsMap, context, configurationHelperFactory);
	},
	'Should set commandsMap and context'() {
		assert.strictEqual(commandsMap, commandHelper._commandsMap);
		assert.strictEqual(context, commandHelper._context);
	},
	'Should return exists = true when a queried command exists'() {
		assert.isTrue(commandHelper.exists('group1', 'command1'));
	},
	'Should accept composite key for query and return exists = true when a command exists'() {
		assert.isTrue(commandHelper.exists('group1-command1'));
	},
	'Should return exists = false when a queried command does not exist'() {
		assert.isFalse(commandHelper.exists('group3', 'command3'));
	},
	'Should run a command that exists and return a promise that resolves'() {
		const key = 'group1-command1';
		return commandHelper.run(key).then((response: string) => {
			assert.equal(key, response);
		})
		.catch(() => {
			assert.fail(null, null, 'commandHelper.run should not have rejected promise');
		});
	},
	'Should run a command that exists with args and return a promise that resolves'() {
		const key = 'group1-command1';
		return commandHelper.run(key, undefined, 'args').then((response: string) => {
			const mockCommand = commandsMap.get(key);
			assert.isTrue(mockCommand.runStub.called);
			assert.equal(mockCommand.runStub.getCall(0).args[1], 'args');
			assert.equal(key, response);
		})
		.catch(() => {
			assert.fail(null, null, 'commandHelper.run should not have rejected promise');
		});
	},
	'Should run a command that exists and return a rejected promise when it fails'() {
		const key = 'group2-failcommand';
		return commandHelper.run(key).then(
			(response: string) => {
				assert.fail(null, null, 'Should not have resolved');
			},
			(error: Error) => {
				assert.equal(key, error.message);
			}
		)
		.catch(() => {
			assert.fail(null, null, 'commandHelper.run should not have rejected promise');
		});
	},
	'Should not run a command that does not exist and return a rejected promise'() {
		const key = 'nogroup-nocommand';
		const expectedErrorMsg = 'The command does not exist';
		return commandHelper.run(key).then(
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
	}
});
