const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert, expect } = intern.getPlugin('chai');

import chalk from 'chalk';
import * as sinon from 'sinon';
import { getValidationErrors, builtInCommandValidation } from '../../../src/commands/validate';

import MockModule from '../../support/MockModule';
import { ValidationWrapper, CommandMap, CommandWrapper } from '../../../src/interfaces';
import { getCommandWrapperWithConfiguration } from '../../support/testHelper';

const { green, yellow, red } = chalk;

describe('validate', () => {
	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockAllExternalCommands: any;
	let sandbox: sinon.SinonSandbox;
	let mockConfigurationHelper: any;
	let consoleLogStub: any;

	const validateableCommandWrapper: ValidationWrapper = {
		commandGroup: 'testGroup',
		commandName: 'testCommand',
		commandSchema: {},
		commandConfig: {},
		silentSuccess: false
	};

	const detailedSchema = {
		definitions: {
			foo: {
				type: 'object',
				properties: {
					bar: { type: 'string' },
					qux: { type: 'number' }
				},
				required: ['bar', 'qux']
			},
			bar: {
				type: 'array',
				items: { $ref: '#/definitions/bar' }
			}
		},
		type: 'object',
		properties: {
			foo: {
				type: 'object',
				required: ['bar'],
				properties: {
					bar: {
						enum: ['foobar']
					},
					qux: {
						type: 'string'
					}
				}
			},
			complex: {
				type: 'object',
				required: ['first', 'second'],
				properties: {
					first: {
						enum: ['one', 'two', 'three']
					},
					second: {
						type: 'number'
					},
					third: {
						type: 'string'
					}
				}
			},
			pattern: {
				type: 'object',
				patternProperties: {
					'^.*$': {
						type: 'array'
					}
				}
			},
			additional: {
				type: 'object',
				additionalProperties: false,
				properties: {
					prop: {
						type: 'string'
					}
				}
			},
			additionalTrue: {
				type: 'object',
				additionalProperties: { type: 'string' }
			},
			ref: {
				type: 'object',
				properties: {
					first: { $ref: '#/definitions/foo' },
					second: { $ref: '#/definitions/foo' }
				}
			},
			str: {
				type: 'string'
			},
			strMinLength: {
				type: 'string',
				minLength: 1
			},
			strMinLengthFive: {
				type: 'string',
				minLength: 5
			},
			arr: {
				type: 'array'
			},
			boolean: {
				type: 'boolean'
			},
			num: {
				type: 'number',
				maximum: 3,
				minimum: 1
			},
			arrUnique: {
				uniqueItems: true
			},
			arrMinItems: {
				minItems: 1
			},
			arrMaxItems: {
				maxItems: 2
			},
			numOneOf: {
				type: 'number',
				oneOf: [{ maximum: 3 }, { type: 'integer' }]
			},
			numAllOf: {
				type: 'number',
				allOf: [{ maximum: 3 }, { type: 'integer' }]
			},
			numAnyOf: {
				type: 'number',
				anyOf: [{ maximum: 3 }, { type: 'integer' }]
			},
			complexOneOf: {
				oneOf: [
					{ type: 'string', minLength: 5 },
					{ type: 'string', minLength: 1 },
					{ type: 'boolean' },
					{ type: 'integer' }
				]
			},
			recursive: {
				type: 'array',
				items: {
					$ref: '#/definitions/bar'
				}
			}
		},
		required: ['foo']
	};

	const nonEnumConfig = {
		foo: { bar: 'foo' }
	};

	const maximumExceededConfig = {
		foo: { bar: 'foobar' },
		num: 4
	};

	const minimumExceededConfig = {
		foo: { bar: 'foobar' },
		num: -1
	};

	const missingRequiredConfig = {
		foo: { foobar: 'foo' }
	};

	const matchedConfig = {
		foo: { bar: 'foobar' }
	};

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		consoleLogStub = sandbox.stub(console, 'log');
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('function', () => {
		describe('getValidationErrors', () => {
			it(`should return no errors if all object criteria are met`, () => {
				assert(getValidationErrors !== undefined);
				expect(getValidationErrors).to.not.be.undefined;
				const mockSchema = {
					type: 'object',
					properties: {
						command: {
							type: 'string'
						}
					},
					required: ['command']
				};
				const errors = getValidationErrors({ command: 'foo' }, mockSchema);
				expect(errors).to.be.lengthOf(0);
			});

			it(`errenous nested properties in configs behave as expected`, () => {
				assert(getValidationErrors !== undefined);
				expect(getValidationErrors).to.not.be.undefined;
				const mockSchema = {
					type: 'object',
					properties: {
						foo: {
							enum: ['baz', 'bar'],
							type: 'object',
							required: ['bar'],
							properties: {
								bar: {
									enum: ['baz', 'bar'],
									type: 'string'
								}
							}
						}
					},
					required: ['foo']
				};
				const config = { ...nonEnumConfig };
				const errors = getValidationErrors(config, mockSchema);
				expect(errors).to.be.lengthOf(2);
			});
		});

		describe('builtInCommandValidation', () => {
			beforeEach(() => {
				consoleLogStub.reset();
			});

			it(`should fail on validating a command with empty config and a valid schema`, async () => {
				validateableCommandWrapper.commandConfig = {};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration misses the property 'foo', which is of type { bar, qux? }.`)
				);
			});

			it(`should fail on validating a command where config value has additional property`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					additional: {
						prop: 'foo',
						unexpected: 'unexpected'
					}
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.additional has an unknown property 'unexpected'.`)
				);
			});

			it(`should fail on validating a command where config value is wrong type (object)`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: 'string'
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red('configuration.foo should be an object with following properties: { bar, qux? }.')
				);
			});

			it(`should fail on validating a command where config value is wrong type object with additional properties`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					additionalTrue: {
						additional: 2
					}
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.additionalTrue['additional'] should be a string.`)
				);
			});

			it(`should fail on validating a command where config value is wrong type (object - complex)`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					complex: {
						first: 'first',
						second: '2',
						third: 3
					}
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(4);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.complex.first should be one of these:
"one" | "two" | "three"`)
				);
				expect(consoleLogStub.getCall(2).args[0]).to.equal(
					red(`configuration.complex.second should be a number.`)
				);
				expect(consoleLogStub.getCall(3).args[0]).to.equal(
					red(`configuration.complex.third should be a string.`)
				);
			});

			it(`should fail on validating a command where config value is wrong type (string)`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					str: 1
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red('configuration.str should be a string.'));
			});

			it(`should fail on validating a command where config value is wrong type (number)`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					num: 'string'
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red('configuration.num should be a number.'));
			});

			it(`should fail on validating a command where config value is wrong type (boolean)`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					boolean: 'string'
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red('configuration.boolean should be a boolean.'));
			});

			it(`should fail on validating a command where config value is wrong type (array)`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					arr: 'string'
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red('configuration.arr should be an array.'));
			});

			it(`should fail on validating a command where config value is not in schema enum`, async () => {
				validateableCommandWrapper.commandConfig = { ...nonEnumConfig };
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red('configuration.foo.bar should be "foobar"'));
			});

			it(`should fail on validating a command where string is length of 1 with error as string can't be empty`, async () => {
				validateableCommandWrapper.commandConfig = { ...nonEnumConfig };
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					strMinLength: ''
				};
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red('configuration.strMinLength should not be empty.')
				);
			});

			it(`should fail on validating a command where string is length greater than 1 with appropriate error`, async () => {
				validateableCommandWrapper.commandConfig = { ...nonEnumConfig };
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					strMinLengthFive: 'four'
				};
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red('configuration.strMinLengthFive should NOT be shorter than 5 characters')
				);
			});

			it(`should fail on validating a command where config property exceeds maximum`, async () => {
				validateableCommandWrapper.commandConfig = { ...maximumExceededConfig };
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red(`configuration.num should be <= 3.`));
			});

			it(`should fail on validating a command with none unique array items where uniqueItems is present`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					arrUnique: ['foo', 'foo']
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.arrUnique should not contain the item 'foo' twice.`)
				);
			});

			it(`should fail on validating a command with array that goes over maximum number of items`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					arrMaxItems: ['foo', 'bar', 'qux']
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.arrMaxItems should NOT have more than 2 items`)
				);
			});

			it(`should fail on validating a command with array that is under the minimum number of items`, async () => {
				validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					arrMinItems: []
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.arrMinItems should not be empty.`)
				);
			});

			it(`should fail on validating a command where config has property is less than minimum `, async () => {
				validateableCommandWrapper.commandConfig = { ...minimumExceededConfig };
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red(`configuration.num should be >= 1.`));
			});

			it(`should fail on validating a command where oneOf is not met`, async () => {
				validateableCommandWrapper.commandConfig = validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					numOneOf: 2 // Must be integer OR max 3
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(
						`configuration.numOneOf should be one of these:
{
  "maximum": 3
} | integer`
					)
				);
			});

			it(`should fail on validating a command where complex oneOf is not met`, async () => {
				validateableCommandWrapper.commandConfig = validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					complexOneOf: {}
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.complexOneOf should be one of these:
string (min length 5) | non-empty string | boolean | integer`)
				);
			});

			it(`should fail on validating a command where allOf is not met`, async () => {
				validateableCommandWrapper.commandConfig = validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					numAllOf: 4.5 // Must be integer AND max 3
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(3);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(red(`configuration.numAllOf should be <= 3.`));
				expect(consoleLogStub.getCall(2).args[0]).to.equal(red(`configuration.numAllOf should be integer.`));
			});

			it(`should fail on validating a command where anyOf is not met`, async () => {
				validateableCommandWrapper.commandConfig = validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					numAnyOf: 3.5 // Must be integer AND max 3
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(
						`configuration.numAnyOf should be one of these:
{
  "maximum": 3
} | integer`
					)
				);
			});

			it(`should handle $ref in schemas correctly`, async () => {
				validateableCommandWrapper.commandConfig = validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					ref: {
						first: { bar: 'foobar' },
						second: { qux: 'foobar' }
					}
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(4);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red("configuration.ref.first misses the property 'qux', which is of type number.")
				);
				expect(consoleLogStub.getCall(2).args[0]).to.equal(
					red("configuration.ref.second misses the property 'bar', which is of type string.")
				);
			});

			it(`should handle recursive properties with an invalid property correctly`, async () => {
				validateableCommandWrapper.commandConfig = validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					recursive: [[[[{}]]]]
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red('configuration.recursive[0][0][0][0] should be an array.')
				);
			});

			it(`should handle pattern properties`, async () => {
				validateableCommandWrapper.commandConfig = validateableCommandWrapper.commandConfig = {
					foo: { bar: 'foobar' },
					pattern: 2
				};
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.pattern should be an object with following pattern of properties: {
  "^.*$": {
    "type": "array"
  }
}`)
				);
			});

			it(`should fail on validating a command where config value is required`, async () => {
				validateableCommandWrapper.commandConfig = { ...missingRequiredConfig };
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(valid).to.be.false;
				expect(consoleLogStub.callCount).to.equal(2);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red('testGroup-testCommand config is invalid! The following issues were found: ')
				);
				expect(consoleLogStub.getCall(1).args[0]).to.equal(
					red(`configuration.foo misses the property 'bar', which is of type "foobar".`)
				);
			});

			it(`should fail on validating a command with undefined config`, async () => {
				validateableCommandWrapper.commandConfig = undefined;
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(consoleLogStub.callCount).to.equal(1);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					red(".dojorc config does not have the top level command property 'testGroup-testCommand'")
				);
				expect(valid).to.be.false;
			});

			it(`should pass on validating a valid command logging success`, async () => {
				validateableCommandWrapper.commandConfig = { ...matchedConfig };
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(consoleLogStub.getCall(0).args[0]).to.equal(
					green('testGroup-testCommand config validation was successful!')
				);
				expect(consoleLogStub.callCount).to.equal(1);
				expect(valid).to.be.true;
			});

			it(`should pass on validating a valid command silently`, async () => {
				validateableCommandWrapper.silentSuccess = true;
				validateableCommandWrapper.commandConfig = { ...matchedConfig };
				validateableCommandWrapper.commandSchema = { ...detailedSchema };
				const valid = await builtInCommandValidation(validateableCommandWrapper);
				expect(consoleLogStub.callCount).to.equal(0);
				expect(valid).to.be.true;
			});
		});
	});

	describe('default export', () => {
		const getHelper = function(config?: any) {
			const basicHelper = {
				command: 'validate',
				configuration: {
					get: sandbox.stub().returns({}),
					set: sandbox.stub()
				}
			};

			return Object.assign({}, basicHelper, config);
		};

		beforeEach(() => {
			mockModule = new MockModule('../../../src/commands/validate', require);
			mockModule.dependencies(['../allCommands', '../configurationHelper']);
			mockAllExternalCommands = mockModule.getMock('../allCommands');
			mockConfigurationHelper = mockModule.getMock('../configurationHelper');
			moduleUnderTest = mockModule.getModuleUnderTest().default;
		});

		afterEach(() => {
			mockModule.destroy();
		});

		it('should call register which has no supported arguments', () => {
			const options = sandbox.stub();
			moduleUnderTest.register(options);
			assert.isFalse(options.called);
		});

		it(`should never call validation logic with no config`, () => {
			const commandMap: CommandMap = new Map<string, CommandWrapper>([]);
			const groupMap = new Map([['test', commandMap]]);

			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			mockConfigurationHelper.getConfig = sandbox.stub().returns(undefined);

			const helper = getHelper();
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.isTrue(consoleLogStub.called);
					assert.equal(consoleLogStub.getCall(0).args[0], yellow(`No config has been detected`));
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'no config route should be taken which should be error free');
				}
			);
		});

		it(`should never call validation logic with empty config`, () => {
			const commandMap: CommandMap = new Map<string, CommandWrapper>([]);
			const groupMap = new Map([['test', commandMap]]);

			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			mockConfigurationHelper.getConfig = sandbox.stub().returns({});

			const helper = getHelper();
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.isTrue(consoleLogStub.called);
					assert.equal(
						consoleLogStub.getCall(0).args[0],
						yellow(`A config was found, but it has no properties`)
					);
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'no config route should be taken which should be error free');
				}
			);
		});

		it(`should return no validatable commands with no commands`, () => {
			const commandMap: CommandMap = new Map<string, CommandWrapper>([]);
			const groupMap = new Map([['test', commandMap]]);

			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			mockConfigurationHelper.getConfig = sandbox.stub().returns({ ...matchedConfig });

			const helper = getHelper();
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.isTrue(mockConfigurationHelper.getConfig.called);
					assert.isTrue(consoleLogStub.called);
					assert.equal(
						consoleLogStub.getCall(0).args[0],
						green(`There were no commands to validate against`)
					);
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'no config route should be taken which should be error free');
				}
			);
		});

		it(`should return no validatable commands with no validatable commands`, () => {
			mockConfigurationHelper.getConfig = sandbox.stub().returns({ foo: 'bar' });
			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test'
			});
			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.equal(
						consoleLogStub.getCall(0).args[0],
						green(`There were no commands to validate against`)
					);
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'no config route should be taken which should be error free');
				}
			);
		});

		it(`should handle errors in the validate function gracefully`, () => {
			const installedCommandWrapper = getCommandWrapperWithConfiguration({
				group: 'command',
				name: 'test',
				validate: sinon.stub().rejects('A test error')
			});
			mockConfigurationHelper.getConfig = sandbox.stub().returns({
				foo: 'bar'
			});
			const commandMap: CommandMap = new Map<string, CommandWrapper>([['command', installedCommandWrapper]]);
			const groupMap = new Map([['test', commandMap]]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.isTrue(
						(installedCommandWrapper.validate as sinon.SinonStub).called,
						'validate should be called'
					);
					assert.isTrue(consoleLogStub.called, 'error log should be called');
					assert.equal(
						consoleLogStub.getCall(0).args[0],
						red(`The validation function for this command threw an error: A test error`)
					);
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'validate should handle error throws gracefully, got error:' + error);
				}
			);
		});

		it(`should handle case with successful and failure validate functions gracefully`, () => {
			mockConfigurationHelper.getConfig = sandbox.stub().returns({ foo: 'bar' });
			const command1 = getCommandWrapperWithConfiguration({
				group: 'command1',
				name: 'test',
				validate: sinon.stub().resolves(true)
			});
			const command2 = getCommandWrapperWithConfiguration({
				group: 'command2',
				name: 'test',
				validate: sinon.stub().rejects('A test error')
			});
			const commandMap: CommandMap = new Map<string, CommandWrapper>([
				['command1', command1],
				['command2', command2]
			]);
			const groupMap = new Map([['test', commandMap]]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.isTrue((command1.validate as sinon.SinonStub).called, 'validate should be called');
					assert.isTrue((command2.validate as sinon.SinonStub).called, 'validate should be called');
					assert.equal(consoleLogStub.callCount, 1, 'error log should be called');
					assert.equal(
						consoleLogStub.getCall(0).args[0],
						red(`The validation function for this command threw an error: A test error`)
					);
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'no config route should be taken which should be error free');
				}
			);
		});

		it(`should log out that there were no issues if all commands are valid`, () => {
			mockConfigurationHelper.getConfig = sandbox.stub().returns({ foo: 'bar' });
			const commandMap: CommandMap = new Map<string, CommandWrapper>([
				[
					'command',
					getCommandWrapperWithConfiguration({
						group: 'command',
						name: 'test',
						validate: sinon.stub().resolves(true)
					})
				],
				[
					'command1',
					getCommandWrapperWithConfiguration({
						group: 'command1',
						name: 'test1',
						validate: sinon.stub().resolves(true)
					})
				]
			]);
			const groupMap = new Map([['test', commandMap]]);
			const helper = getHelper();
			mockAllExternalCommands.loadExternalCommands = sandbox.stub().resolves(groupMap);
			return moduleUnderTest.run(helper, {}).then(
				() => {
					assert.equal(consoleLogStub.getCall(0).args[0], green(`There were no issues with your config!`));
				},
				(error: { message: string }) => {
					assert.fail(null, null, 'no config route should be taken which should be error free');
				}
			);
		});
	});
});
