import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import { SinonStub, stub } from 'sinon';

const updateNotifierStub: SinonStub = stub();
const yargsVersionStub: SinonStub = stub();
const installedCommandLoaderStub: SinonStub = stub();
let builtInCommandLoaderStub: SinonStub = stub();
const builtInCommandEnumeratorStub: SinonStub = stub();
const installedCommandEnumeratorStub: SinonStub = stub();
const loadCommandsStub: SinonStub = stub().returns(Promise.resolve({
	commandsMap: new Map([
		['key1', {name: 'a', group: 'c', path: 'as'}],
		['key2', {name: 'b', group: 'd', path: 'asas'}]
	]),
	yargsCommandNames: new Map([
		['key3', new Set(['a', 'b'])],
		['key4', new Set(['d', 'e'])]
	])
}));
const registerCommandsStub: SinonStub = stub();
const consoleStub: SinonStub = stub();
let index: any;

registerSuite({
	name: 'index',
	'setup'() {
		mockery.enable({ 'warnOnUnregistered': false });

		mockery.registerMock('./updateNotifier', { 'default': updateNotifierStub });
		mockery.registerMock('./config', { 'default': {} });

		mockery.registerMock('./command', {
			'createBuiltInCommandLoader': builtInCommandLoaderStub,
			'initCommandLoader': installedCommandLoaderStub });

		mockery.registerMock('./loadCommands', {
			'enumerateBuiltInCommands': builtInCommandEnumeratorStub,
			'enumerateInstalledCommands': installedCommandEnumeratorStub,
			'loadCommands': loadCommandsStub });

		mockery.registerMock('./registerCommands', { 'default': registerCommandsStub });
		mockery.registerMock('testDir/package.json', { 'testKey': 'testValue' });

		mockery.registerMock('yargs', { 'version': yargsVersionStub });
		mockery.registerMock('pkg-dir', { 'sync': stub().returns('testDir') });
		mockery.registerMock('console', { 'log': consoleStub()});
	},
	'teardown'() {
		mockery.deregisterAll();
		mockery.disable();
	},
	'Should call functions in order'() {
		index = require('intern/dojo/node!./../../src/index');
		assert.isTrue(updateNotifierStub.calledOnce, 'should call update notifier');

		assert.isTrue(builtInCommandLoaderStub.calledOnce, 'should call builtin command loader');
		assert.isTrue(installedCommandLoaderStub.calledOnce, 'should call installed command loader');

		assert.isTrue(builtInCommandEnumeratorStub.calledOnce, 'should call builtin command enumerator');
		assert.isTrue(installedCommandEnumeratorStub.calledOnce, 'should call installed command enumerator');
		assert.isTrue(installedCommandEnumeratorStub.calledAfter(builtInCommandEnumeratorStub));

		assert.isTrue(loadCommandsStub.calledTwice, 'should call load commands');
		assert.isTrue(loadCommandsStub.calledAfter(installedCommandEnumeratorStub), 'should call load commands concat of commands');

		assert.isTrue(registerCommandsStub.calledOnce, 'should call register commands');
		assert.isTrue(registerCommandsStub.calledAfter(loadCommandsStub), 'should call register commands after load commands');
	},
	'Should catch runtime errors'() {
		index = require('intern/dojo/node!./../../src/index');
		const errMessage = 'ugh - oh noes';
		const expectedError = new Error(errMessage);
		builtInCommandLoaderStub = stub().throws(expectedError);

		assert.isTrue(updateNotifierStub.calledOnce, 'should call update notifier');
		
		assert.throw(builtInCommandLoaderStub, Error, errMessage);
		assert.equal(`Some commands are not available: ${errMessage}`, consoleStub.args[0][0]);
	}
});
