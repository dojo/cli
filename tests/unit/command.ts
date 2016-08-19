import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { load } from 'src/command';
import * as sinon from 'sinon';

// let existsStub: SinonStub;
// let mkdirsStub: SinonStub;
const testCommandPath = '../path';

registerSuite({
	name: 'command',
	'beforeEach'() {
		// existsStub = stub(fs, 'existsSync');
		// mkdirsStub = stub(fs, 'mkdirsSync');
	},
	'afterEach'() {
		// existsStub.restore();
		// mkdirsStub.restore();
	},
	'load': {
		'beforeEach'() {
			// sinon.stub()
		},
		'afterEach'() {

		},
		'should get description from module'() {
			const command = load(testCommandPath);
			assert.isTrue(command.name);
		}
		// createDir('/tmp/parentFolder/childFolder');
		// assert.isTrue(existsStub.firstCall.calledWith('/tmp/parentFolder/childFolder'));
		// assert.isTrue(mkdirsStub.firstCall.calledWith('/tmp/parentFolder/childFolder'));
	}
});
