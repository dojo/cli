import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../support/MockModule';
const sap = require('sinon-as-promised');
const sinon = new sap(Promise);

describe('AllCommands', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let sandbox: any;
	let mockCommand: any;
	let mockLoadCommands: any;

	it('should run functions in order', () => {
		describe('inner', () => {
			beforeEach(() => {

				sandbox = sinon.sandbox.create();
				mockModule = new MockModule('../../src/allCommands');
				mockModule.dependencies([
					'./command',
					'./loadCommands',
					'./config']);
				mockCommand = mockModule.getMock('./command');
				mockLoadCommands = mockModule.getMock('./loadCommands');

				mockLoadCommands.loadCommands = sandbox.stub().resolves({
					commandsMap: new Map([
						['key1', {name: 'a', group: 'c', path: 'as'}],
						['key2', {name: 'b', group: 'd', path: 'asas'}]
					]),
					yargsCommandNames: new Map([
						['key3', new Set(['a', 'b'])],
						['key4', new Set(['d', 'e'])]
					])
				});
				moduleUnderTest = mockModule.getModuleUnderTest();
				sandbox.stub(console, 'log');
			});

			afterEach(() => {
				sandbox.restore();
				mockModule.destroy();
			});

			it('should run loadCommands to completion', () => {
				return moduleUnderTest.default()
					.then((allCommands) => {
						assert.isTrue(mockCommand.createBuiltInCommandLoader.calledOnce, 'should call builtin command loader');
						assert.isTrue(mockCommand.initCommandLoader.calledOnce, 'should call installed command loader');

						assert.isTrue(mockLoadCommands.enumerateBuiltInCommands.calledOnce, 'should call builtin command enumerator');
						assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledOnce, 'should call installed command enumerator');
						assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledAfter(mockLoadCommands.enumerateBuiltInCommands));
						assert.isTrue(mockLoadCommands.loadCommands.calledTwice, 'should call load commands twice');
						assert.isTrue(mockLoadCommands.loadCommands.calledAfter(mockLoadCommands.enumerateInstalledCommands),
							'should call loadcommands after both enumerations');
					});
			});
			it('should perform initialsation only once', () => {
				moduleUnderTest.default()
					.then(function(){
						assert.isTrue(mockCommand.createBuiltInCommandLoader.calledOnce, 'should call builtin command loader once');
						assert.isTrue(mockCommand.initCommandLoader.calledOnce, 'should call installed command loader once');
						assert.isTrue(mockLoadCommands.enumerateBuiltInCommands.calledOnce, 'should call builtin command enumerator once');
						assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledOnce, 'should call installed command enumerator once');
						assert.isTrue(mockLoadCommands.loadCommands.calledTwice, 'should call load commands twice only');

						moduleUnderTest.default()
							.then(function(){
								assert.isTrue(mockCommand.createBuiltInCommandLoader.calledOnce, 'should call builtin command loader once');
								assert.isTrue(mockCommand.initCommandLoader.calledOnce, 'should call installed command loader once');
								assert.isTrue(mockLoadCommands.enumerateBuiltInCommands.calledOnce, 'should call builtin command enumerator once');
								assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledOnce, 'should call installed command enumerator once');
								assert.isTrue(mockLoadCommands.loadCommands.calledTwice, 'should call load commands twice only');
							});
					});
			});
			it('should reset the command cache', () => {
				moduleUnderTest.default()
					.then(function(){
						assert.isTrue(mockCommand.createBuiltInCommandLoader.calledOnce, 'should call builtin command loader once');
						assert.isTrue(mockCommand.initCommandLoader.calledOnce, 'should call installed command loader once');
						assert.isTrue(mockLoadCommands.enumerateBuiltInCommands.calledOnce, 'should call builtin command enumerator once');
						assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledOnce, 'should call installed command enumerator once');
						assert.isTrue(mockLoadCommands.loadCommands.calledTwice, 'should call load commands twice only');

						moduleUnderTest.reset();
						moduleUnderTest.default()
							.then(function(){
								assert.isTrue(mockCommand.createBuiltInCommandLoader.calledTwice, 'should call builtin command loader once');
								assert.isTrue(mockCommand.initCommandLoader.calledTwice, 'should call installed command loader once');
								assert.isTrue(mockLoadCommands.enumerateBuiltInCommands.calledTwice, 'should call builtin command enumerator once');
								assert.isTrue(mockLoadCommands.enumerateInstalledCommands.calledTwice, 'should call installed command enumerator once');
								assert.equal(mockLoadCommands.loadCommands.callCount, 4, 'should call load commands twice only');
							});
					});
			});
		});
	});
});
