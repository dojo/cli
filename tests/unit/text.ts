import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
const text = require('intern/dojo/node!../../src/text');

registerSuite({
	name: 'text',
	'Should export helpUsage'() {
		assert.isNotNull(text.helpUsage);
		assert.equal('string', typeof text.helpUsage);
	},
	'Should export helpEpilog'() {
		assert.isNotNull(text.helpEpilog);
		assert.equal('string', typeof text.helpEpilog);
	}
});
