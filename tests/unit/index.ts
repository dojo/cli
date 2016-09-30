import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import { SinonStub, stub } from 'sinon';

const updateNotifierStub: SinonStub = stub();
const yargsVersionStub: SinonStub = stub();
const commandLoaderStub: SinonStub = stub();
const loadCommandsStub: SinonStub = stub().returns(Promise.resolve());
const registerCommandsStub: SinonStub = stub();
let index: any;

registerSuite({
	name: 'index',
	'setup'() {
		mockery.enable({ 'warnOnUnregistered': false });

		mockery.registerMock('./updateNotifier', { 'default': updateNotifierStub });
		mockery.registerMock('./config', { 'default': {} });
		mockery.registerMock('./command', { 'initCommandLoader': commandLoaderStub });
		mockery.registerMock('./loadCommands', { 'default': loadCommandsStub });
		mockery.registerMock('./registerCommands', { 'default': registerCommandsStub });
		mockery.registerMock('testDir/package.json', { 'testKey': 'testValue' });

		mockery.registerMock('yargs', { 'version': yargsVersionStub });
		mockery.registerMock('pkg-dir', { 'sync': stub().returns('testDir') });

		index = require('intern/dojo/node!./../../src/index');
	},
	'teardown'() {
		mockery.deregisterAll();
		mockery.disable();
	},
	'Should call updateNotifier'() {
		assert.isTrue(updateNotifierStub.calledOnce);
	},
	'Should set yargs version'() {
		assert.isTrue(yargsVersionStub.calledOnce);
		assert.isTrue(yargsVersionStub.calledAfter(updateNotifierStub));
	},
	'Should init the command loader'() {
		assert.isTrue(commandLoaderStub.calledOnce);
		assert.isTrue(commandLoaderStub.calledAfter(yargsVersionStub));
	},
	'Should load the commands using the command loader'() {
		assert.isTrue(loadCommandsStub.calledOnce);
		assert.isTrue(loadCommandsStub.calledAfter(commandLoaderStub));
	}
});
