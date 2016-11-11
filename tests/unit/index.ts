import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import { SinonStub, stub } from 'sinon';

const updateNotifierStub: SinonStub = stub();
const yargsVersionStub: SinonStub = stub();
const commandLoaderStub: SinonStub = stub();
const loadCommandsStub: SinonStub = stub().returns(Promise.resolve());
const registerCommandsStub: SinonStub = stub();
const fakePackageRoot = 'fakePackageRoot';
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
		mockery.registerMock('./dirname', { 'default': fakePackageRoot });

		index = require('intern/dojo/node!./../../src/index');
	},
	'teardown'() {
		mockery.deregisterAll();
		mockery.disable();
	},
	'Should call functions in order'() {
		assert.isTrue(updateNotifierStub.calledOnce, 'should call update notifier');
		assert.isTrue(commandLoaderStub.calledOnce, 'should call init command loader');
		assert.isTrue(commandLoaderStub.calledAfter(updateNotifierStub),
			'should call init command loader after set yargs version');
		assert.isTrue(loadCommandsStub.calledOnce, 'should call load commands');
		assert.isTrue(loadCommandsStub.calledAfter(commandLoaderStub),
			'should call load commands after init command loader');
	}
});
