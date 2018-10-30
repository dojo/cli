const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');
import template from './../../src/template';
import { getLoggingStub, LoggingStub } from '../support/testHelper';
import * as fs from 'fs-extra';
import { stub, SinonStub } from 'sinon';
import chalk from 'chalk';

let writeFileStub: SinonStub;
let mockLoggingHelper: LoggingStub;
let ensureDirStub: SinonStub;
const testEjsSrc = 'tests/support/template.ejs';
const testDest = '/tmp/test/destination/file.ts';
const value = 'testValue';

registerSuite('template', {
	before() {
		mockLoggingHelper = getLoggingStub();
	},
	beforeEach() {
		writeFileStub = stub(fs, 'writeFile').resolves();
		ensureDirStub = stub(fs, 'ensureDir').resolves();
	},
	afterEach() {
		ensureDirStub.restore();
		writeFileStub.restore();
	},

	tests: {
		async 'directories are checked to exist'() {
			await template(testEjsSrc, testDest, { value }, mockLoggingHelper);
			assert.isTrue(ensureDirStub.called);
			assert.strictEqual(ensureDirStub.firstCall.args[0], '/tmp/test/destination');
			assert.strictEqual(mockLoggingHelper.info.getCall(0).args[0], chalk.bold(' create ') + testDest);
		},
		async 'can render ejs file'() {
			await template(testEjsSrc, testDest, { value }, mockLoggingHelper);
			assert.strictEqual(writeFileStub.firstCall.args[1].trim(), value);
			assert.strictEqual(mockLoggingHelper.info.getCall(0).args[0], chalk.bold(' create ') + testDest);
		},
		async 'write file is called with dest path'() {
			await template(testEjsSrc, testDest, { value }, mockLoggingHelper);
			assert.strictEqual(writeFileStub.firstCall.args[0], testDest);
			assert.strictEqual(mockLoggingHelper.info.getCall(0).args[0], chalk.bold(' create ') + testDest);
		}
	}
});
