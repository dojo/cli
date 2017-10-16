const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as text from '../../src/text';

registerSuite('text', {
	exports: (function (exportedStrings) {
		const tests: { [key: string]: () => void; } = {};

		exportedStrings.forEach(function (exportedString) {
			tests[exportedString] = () => {
				assert.isNotNull((<any> text)[exportedString]);
				assert.isString((<any> text)[exportedString]);
			};
		});

		return tests;
	})([
		'helpUsage',
		'helpEpilog'
	])
});
