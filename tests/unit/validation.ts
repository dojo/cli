const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import { createOptionValidator, isRequiredOption } from './../../src/validation';
import { CommandWrapper, OptionsHelper, Helper } from '../../src/interfaces';

const groupMap = new Map();
const fooCommandMap = new Map<string, CommandWrapper>();
const barCommandMap = new Map<string, CommandWrapper>();

fooCommandMap.set('global', {
	name: 'global',
	group: 'foo',
	path: 'path/to/command',
	global: true,
	installed: true,
	description: 'a global command',
	default: true,
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { description: 'a basic option' });
		options('bar', { defaultDescription: 'a required option', require: true });
	},
	run: () => Promise.resolve()
});
fooCommandMap.set('project', {
	name: 'project',
	group: 'foo',
	path: 'path/to/command',
	global: false,
	installed: true,
	description: 'a project command',
	default: false,
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { description: 'a basic option', require: true });
		options('bar', { defaultDescription: 'a required option', require: true });
	},
	run: () => Promise.resolve()
});
barCommandMap.set('default', {
	name: 'default',
	group: 'bar',
	path: 'path/to/command',
	global: false,
	installed: true,
	default: true,
	description: 'default installed command for bar',
	register: (options: OptionsHelper, helper: Helper) => {
		options('foo', { describe: 'a basic option', alias: ['f', 'foooo '] });
		options('b', { defaultDescription: 'a required option', alias: 'bar' });
	},
	run: () => Promise.resolve()
});

groupMap.set('foo', fooCommandMap);
groupMap.set('bar', barCommandMap);

const optionValidator = createOptionValidator(groupMap);

describe('validation', () => {
	describe('optionValidator', () => {
		it('Should return validation error for required option', () => {
			try {
				optionValidator({ _: ['foo', 'global'] });
				assert.fail('Should throw a validation error');
			} catch (err) {
				assert.strictEqual(
					err.message,
					"\n\u001b[1m\u001b[31mError(s):\u001b[39m\u001b[22m\n  Required option '\u001b[91mbar\u001b[39m' not provided"
				);
			}
		});

		it('Should return validation error for multiple options', () => {
			try {
				optionValidator({ _: ['foo', 'project'] });
				assert.fail('Should throw a validation error');
			} catch (err) {
				assert.strictEqual(
					err.message,
					"\n\u001b[1m\u001b[31mError(s):\u001b[39m\u001b[22m\n  Required option '\u001b[91mfoo\u001b[39m' not provided\n  Required option '\u001b[91mbar\u001b[39m' not provided"
				);
			}
		});

		it('Should not return validation error for when option provided', () => {
			assert.isTrue(optionValidator({ _: ['foo', 'global'], foo: 'bar', bar: 'foo' }));
		});

		it('Should not return validation error for no required options', () => {
			assert.isTrue(optionValidator({ _: ['bar', 'default'] }));
		});

		it('Should not return validation error when help option provided', () => {
			assert.isTrue(optionValidator({ _: ['foo', 'global'], h: true }));
			assert.isTrue(optionValidator({ _: ['foo', 'global'], help: true }));
		});
	});
	describe('isRequiredOption', () => {
		it('for required option', () => {
			assert.isTrue(isRequiredOption({ require: true }));
			assert.isTrue(isRequiredOption({ required: true }));
			assert.isTrue(isRequiredOption({ requiresArg: true }));
			assert.isTrue(isRequiredOption({ demand: true }));
			assert.isTrue(isRequiredOption({ demandOption: true }));
		});

		it('for not required option', () => {
			assert.isFalse(isRequiredOption({}));
		});
	});
});
