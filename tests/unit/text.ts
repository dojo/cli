import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
const text = require('intern/dojo/node!../../src/text');

registerSuite({
	name: 'text',
	exports: (function (exportedStrings) {
		const tests: (() => void)[] = [];

		exportedStrings.forEach(function (exportedString) {
			tests.push(function () {
				assert.isNotNull(text[exportedString]);
				assert.isString(text[exportedString]);
			});
		});

		return tests;
	})([
		'helpUsage',
		'helpEpilog'
	])
});
