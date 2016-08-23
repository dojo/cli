import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { getCommandsMap, GroupDef } from '../support/testHelper';
const command = require('intern/dojo/node!../../src/command');

const testGroup = 'foo';
const testName = 'bar';
const testSearchPrefix = 'test-prefix';
const testCommandPath = `../tests/support/${testSearchPrefix}-${testGroup}-${testName}`;
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

registerSuite({
	name: 'command',
	'setup'() {
		command.setSearchPrefix(testSearchPrefix);
	},
	'load': {
		'beforeEach'() {
			commandWrapper = command.load(testCommandPath);
		},
		'Should get group and name from filename'() {
			assert.equal(testGroup, commandWrapper.group);
			assert.equal(testName, commandWrapper.name);
		},
		'Should get description from loaded file'() {
			assert.equal('test-description', commandWrapper.description);
		},
		'Should get register function from loaded file'() {
			assert.isTrue(typeof commandWrapper.register === 'function');
		},
		'Should get run function from loaded file'() {
			assert.isTrue(typeof commandWrapper.run === 'function');
		}
	},
	'getGroupDescription': {
		'Should return simple command description when only one command name passed'() {
			const key = 'group1-command1';
			const description = command.getGroupDescription([key], commandsMap);
			assert.equal(commandsMap.get(key).description, description);
		},
		'Should return composite description of sub commands when multiple command names passed'() {
			const key1 = 'group1-command1';
			const key2 = 'group2-command1';
			const description = command.getGroupDescription([key1, key2], commandsMap);
			const expected = `${commandsMap.get(key1).name}  ${commandsMap.get(key1).description}\n${commandsMap.get(key1).name}  ${commandsMap.get(key2).description}`;

			assert.equal(expected, description);
		}
	}
});
