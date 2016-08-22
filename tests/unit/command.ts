import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';

import { setSearchPrefix, load } from 'src/command';

// let existsStub: SinonStub;
// let mkdirsStub: SinonStub;
const testCommandPath = '../test-prefix-foo-bar';
const testSearchPrefix = 'test-prefix';
// commandRegExp

registerSuite({
	name: 'command',
	'setup'() {
		setSearchPrefix(testSearchPrefix);
	},
	'teardown'() {
		// existsStub = stub(fs, 'existsSync');
		// mkdirsStub = stub(fs, 'mkdirsSync');
	},
	'afterEach'() {
		// existsStub.restore();
		// mkdirsStub.restore();
	},
	'load': {
		'beforeEach'() {

		},
		'afterEach'() {

		},
		'should get description from module'() {
			const loaded = load(testCommandPath);
			assert.isTrue(loaded.name === 'badger');
		}
		// createDir('/tmp/parentFolder/childFolder');
		// assert.isTrue(existsStub.firstCall.calledWith('/tmp/parentFolder/childFolder'));
		// assert.isTrue(mkdirsStub.firstCall.calledWith('/tmp/parentFolder/childFolder'));
	}
});
