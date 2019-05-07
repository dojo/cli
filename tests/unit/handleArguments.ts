import { processArgs } from '../../src/handleArguments';

const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('handleArguments', () => {
	describe('processArgs', () => {
		it('should handle single command (no arguments)', () => {
			const args = processArgs(['build']);
			assert.strictEqual(args, {});
		});

		it('should handle builtin eject command (no arguments)', () => {
			const args = processArgs(['eject']);
			assert.strictEqual(args, {});
		});

		it('should handle builtin validate command (no arguments)', () => {
			const args = processArgs(['validate']);
			assert.strictEqual(args, {});
		});

		// it('should handle single command (no arguments)', () => {
		// 	const fooHelp = formatHelp({ _: ['foo'] }, groupMap);
		// 	const barHelp = formatHelp({ _: ['bar'] }, groupMap);
		// 	assert.strictEqual(fooHelp, expectedFooGroupHelp);
		// 	assert.strictEqual(barHelp, expectedBarGroupHelp);
		// });
	});
});
