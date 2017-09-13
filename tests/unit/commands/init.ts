import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import * as sinon from 'sinon';

describe('init command', () => {

	let mockModule: MockModule;
	let sandbox: sinon.SinonSandbox;
	let fs: any;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/commands/init');
		mockModule.dependencies([ 'fs', 'pkg-dir', '../allCommands' ]);

		const pkgDir = mockModule.getMock('pkg-dir');
		pkgDir.ctor.sync = sandbox.stub().returns('./');

		fs = mockModule.getMock('fs');
		fs.existsSync = sandbox.stub().returns(true);
		fs.writeFileSync = sandbox.stub();

		const commandsMap = new Map();
		const build = {
			name: 'webpack',
			group: 'build'
		};
		const test = {
			name: 'intern',
			group: 'test'
		};

		commandsMap.set('build', build);
		commandsMap.set('build-webpack', build);
		commandsMap.set('test', test);
		commandsMap.set('test-intern', test);

		const allCommands = mockModule.getMock('../allCommands');
		allCommands.loadExternalCommands.returns({ commandsMap });
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('creates a .dojorc with the available commands', async () => {
		fs.readFileSync = sandbox.stub().returns(undefined);
		const moduleUnderTest = mockModule.getModuleUnderTest().default;
		await moduleUnderTest.run();
		const [ , content ] = fs.writeFileSync.firstCall.args;
		assert.equal(
			content,
			JSON.stringify({ 'build-webpack': {}, 'test-intern': {} }, null, '\t')
		);
	});

	it('updates a .dojorc with the available commands', async () => {
		fs.readFileSync = sandbox.stub().returns('{}');
		const moduleUnderTest = mockModule.getModuleUnderTest().default;
		await moduleUnderTest.run();
		const [ , content ] = fs.writeFileSync.firstCall.args;
		assert.equal(
			content,
			JSON.stringify({ 'build-webpack': {}, 'test-intern': {} }, null, '\t')
		);
	});

	it('updates a .dojorc, but does not overwrite existing config', async () => {
		fs.readFileSync = sandbox.stub().returns(
			JSON.stringify({ 'build-webpack': { 'foo': 'bar' } }, null, '\t')
		);
		const moduleUnderTest = mockModule.getModuleUnderTest().default;
		await moduleUnderTest.run();
		const [ , content ] = fs.writeFileSync.firstCall.args;
		assert.equal(
			content,
			JSON.stringify({
				'build-webpack': {
					'foo': 'bar'
				},
				'test-intern': {}
			}, null, '\t')
		);
	});

	it('updates a .dojorc and keeps indent formatting', async () => {
		fs.readFileSync = sandbox.stub().returns(
			JSON.stringify({ 'build-webpack': { 'foo': 'bar' } }, null, 2)
		);
		const moduleUnderTest = mockModule.getModuleUnderTest().default;
		await moduleUnderTest.run();
		const [ , content ] = fs.writeFileSync.firstCall.args;
		assert.equal(
			content,
			JSON.stringify({
				'build-webpack': {
					'foo': 'bar'
				},
				'test-intern': {}
			}, null, 2)
		);
	});

});
