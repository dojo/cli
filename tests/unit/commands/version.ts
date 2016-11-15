import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import MockModule from '../../support/MockModule';
import { throwImmediatly } from '../../support/util';
import * as sinon from 'sinon';

describe('main', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockWebpack: any;
	let mockWebpackConfig: any;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../../src/commands/version');
		mockModule.dependencies(['./webpack.config', 'webpack', 'webpack-dev-server']);
		mockWebpack = mockModule.getMock('webpack');
		mockWebpackConfig = mockModule.getMock('./webpack.config');
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		sandbox.stub(console, 'log');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should register supported arguments', () => {
		const helper = { yargs: { option: sandbox.stub() } };
		moduleUnderTest.register(helper);
		assert.deepEqual(
			helper.yargs.option.firstCall.args,
			[ 'w', { alias: 'watch', describe: 'watch and serve' } ]
		);
		assert.deepEqual(
			helper.yargs.option.secondCall.args,
			[ 'p', { alias: 'port', describe: 'port to serve on when using --watch', type: 'number' }],
		);
	});

	it('should run compile and log results on success', () => {
		mockWebpack.run = sandbox.stub().yields(false, 'some stats');
		return moduleUnderTest.run({}, {}).then(() => {
			assert.isTrue(mockWebpack.run.calledOnce);
			assert.isTrue((<sinon.SinonStub> console.log).calledWith('some stats'));
		});
	});

});

import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { CommandsMap, CommandWrapper } from '../../../src/command';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';
const { readPackageDetails, buildVersions, versionNoRegisteredCommands, versionNoVersion, versionRegisteredCommands,
'default': createVersionsString } = require('intern/dojo/node!../../../src/commands/version');

registerSuite({
	name: 'text',

	readPackageDetails: {
		validPackage() {
			const details = readPackageDetails('../tests/support/valid-package');

			assert.equal(details.name, 'Test Package 1');
			assert.equal(details.version, '1.0.0');
		},

		missingPackage() {
			const details = readPackageDetails('../tests/support');

			assert.equal(details.name, '../tests/support');
			assert.equal(details.version, versionNoVersion);
		}
	},

	buildVersions() {

		const commandWrapper1 = getCommandWrapperWithConfiguration({
				group: 'apple',
				name: 'test',
				path: '../tests/support/valid-package'
			}),
			commandWrapper2 = getCommandWrapperWithConfiguration({
				group: 'banana',
				name: 'test 2',
				path: '../tests/support'
			});

		const commandMap: CommandsMap = new Map<string, CommandWrapper>([
			['banana', commandWrapper2],
			['apple', commandWrapper1]
		]);

		const commands = buildVersions(commandMap);

		assert.equal(commands.length, 2, 'There should be two commands');
		assert.equal(commands[0].name, 'Test Package 1');
		assert.equal(commands[0].version, '1.0.0');
		assert.equal(commands[0].group, 'apple');

		assert.equal(commands[1].name, '../tests/support');
		assert.equal(commands[1].version, versionNoVersion);
		assert.equal(commands[1].group, 'banana');
	},

	'createCommand': {
		'no commands'() {
			const commandMap: CommandsMap = new Map<string, CommandWrapper>();

			assert.include(createVersionsString(commandMap), versionNoRegisteredCommands);
		},

		'commands'() {
			const commandWrapper1 = getCommandWrapperWithConfiguration({
					group: 'apple',
					name: 'test',
					path: '../tests/support/valid-package'
				}),
				commandWrapper2 = getCommandWrapperWithConfiguration({
					group: 'banana',
					name: 'test 2',
					path: '../tests/support'
				});

			const commandMap: CommandsMap = new Map<string, CommandWrapper>([
				['apple', commandWrapper1],
				['banana', commandWrapper2]
			]);

			const output = createVersionsString(commandMap);

			assert.include(output, versionRegisteredCommands);
			assert.include(output, 'apple (Test Package 1) 1.0.0');
			assert.include(output, 'banana (../tests/support) ' + versionNoVersion) ;
		}
	}
});
