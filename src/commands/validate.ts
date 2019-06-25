/*
	Parts of this fule are adapted from Webpack source, licensed under:
    MIT License http://www.opensource.org/licenses/mit-license.php
	Author Gajus Kuizinas @gajus
*/
import { Argv } from 'yargs';
import chalk from 'chalk';
import { CommandWrapper, Helper, OptionsHelper, ValidationWrapper } from '../interfaces';
import { loadExternalCommands } from '../allCommands';
import configurationHelperFactory, { getConfig } from '../configurationHelper';
import CommandHelper from '../CommandHelper';
import HelperFactory from '../Helper';
import Ajv = require('ajv');

const { red, green, yellow } = chalk;

export interface ValidateArgs extends Argv {}

function register(options: OptionsHelper): void {}

export function logNoConfig() {
	console.log(yellow('No config has been detected'));
}

export function logValidateFunctionFailed(error: Error) {
	console.log(red(`The validation function for this command threw an error: ${error}`));
}

export function logEmptyConfig() {
	console.log(yellow('A config was found, but it has no properties'));
}

export function logSchemaErrors(mismatch: string) {
	console.log(`  ▹ ${red(mismatch)}\n`);
}

export function logValidationFailed(commandKey: string) {
	console.log(red(`${commandKey} config is invalid! The following issues were found: \n`));
}

export function logSchemaSuccess(commandName: string) {
	console.log(green(`${commandName} config validation was successful!`));
}

export function logConfigValidateSuccess() {
	console.log(green('There were no issues with your config!'));
}

export function logNoValidatableCommands() {
	console.log(green('There were no commands to validate against'));
}

export function getValidationErrors(commandKey: string, commandConfig: any, commandSchema: any): string[] {
	const ajv = new Ajv({ allErrors: true, verbose: true });

	const validate = ajv.compile(commandSchema);
	validate(commandConfig);

	let errors: string[] = [];

	if (validate.errors) {
		errors = filterErrors(validate.errors).map((error) => {
			return formatValidationErrors(commandKey, commandSchema, error);
		});
	}

	return errors;
}

// anyOf and oneOf will also list the individual errors
// allOf is decomposed into it's individual errors so we do not need to filter
function filterCompound(errors: Ajv.ErrorObject[], compound: 'anyOf' | 'oneOf') {
	let anyOfPath: string;
	const hasAnyOf = errors.some((err) => {
		if (err.keyword === compound) {
			anyOfPath = err.schemaPath;
			return true;
		}
		return false;
	});

	return hasAnyOf
		? errors.filter((err) => {
				if (err.schemaPath.startsWith(anyOfPath) && err.keyword !== compound) {
					return false;
				}
				return true;
		  })
		: errors;
}

function filterErrors(errors: Ajv.ErrorObject[]) {
	errors = filterCompound(errors, 'oneOf');
	errors = filterCompound(errors, 'anyOf');
	return errors;
}

function formatSchema(schemaToFormat: any): string {
	if (schemaToFormat.oneOf) {
		return schemaToFormat.oneOf.map(formatSchema).join(' | ');
	}
	if (schemaToFormat.anyOf) {
		return schemaToFormat.anyOf.map(formatSchema).join(' | ');
	}
	if (schemaToFormat.enum) {
		return schemaToFormat.enum.map((item: any) => JSON.stringify(item)).join(' | ');
	}

	if (schemaToFormat.type === 'string') {
		if (schemaToFormat.minLength === 1) {
			return 'non-empty string';
		}
		if (schemaToFormat.minLength > 1) {
			return `string (min length ${schemaToFormat.minLength})`;
		}
		return 'string';
	}
	if (schemaToFormat.type === 'boolean') {
		return 'boolean';
	}
	if (schemaToFormat.type === 'number') {
		return 'number';
	}
	if (schemaToFormat.type === 'integer') {
		return 'integer';
	}
	if (schemaToFormat.type === 'object') {
		if (schemaToFormat.properties) {
			const required = schemaToFormat.required || [];
			return `\n    { ${Object.keys(schemaToFormat.properties)
				.map((property) => {
					if (!required.includes(property)) {
						return property + '?';
					}
					return property;
				})
				.concat(schemaToFormat.additionalProperties ? ['…'] : [])
				.join(', ')} }`;
		}
		if (schemaToFormat.patternProperties) {
			return formatObject(schemaToFormat.patternProperties);
		}
	}
	return formatObject(schemaToFormat);
}

function formatObject(obj: any) {
	return (
		'\n' +
		JSON.stringify(obj, null, 4)
			.replace('{', '    {')
			.replace(new RegExp('\n', 'g'), '\n    ')
	);
}

function formatValidationErrors(commandKey: string, commandSchema: any, err: any): string {
	const dataPath = `config.${commandKey}${err.dataPath}`;

	if (err.keyword === 'additionalProperties') {
		return `${dataPath} has an unknown property '${err.params.additionalProperty}'.`;
	} else if (err.keyword === 'oneOf' || err.keyword === 'anyOf') {
		return `${dataPath} should be one of these:\n${formatSchema(err.parentSchema)}`;
	} else if (err.keyword === 'enum') {
		if (err.parentSchema && err.parentSchema.enum && err.parentSchema.enum.length === 1) {
			return `${dataPath} should be ${formatSchema(err.parentSchema)}`;
		}
		return `${dataPath} should be one of these:\n${formatSchema(err.parentSchema)}`;
	} else if (err.keyword === 'type') {
		switch (err.params.type) {
			case 'object':
				if (err.parentSchema.patternProperties) {
					return `${dataPath} should be an object with following pattern of properties:\n${formatSchema(
						err.parentSchema
					)}`;
				}
				return `${dataPath} should be an object with following properties:\n${formatSchema(err.parentSchema)}`;
			case 'string':
				return `${dataPath} should be a string.`;
			case 'boolean':
				return `${dataPath} should be a boolean.`;
			case 'number':
				return `${dataPath} should be a number.`;
			case 'array':
				return `${dataPath} should be an array.`;
		}
		return `${dataPath} should be ${err.params.type}.`;
	} else if (err.keyword === 'required') {
		const missingProperty = err.params.missingProperty.replace(/^\./, '');
		const schema = err.schema[missingProperty];
		let form = formatSchema(schema);
		if (schema.type === 'object') {
			form = `:\n${form}\n`;
		} else {
			form = ` ${form}.`;
		}
		return `${dataPath} misses the property '${missingProperty}', which is of type${form}`;
	} else if (err.keyword === 'minimum' || err.keyword === 'maximum') {
		return `${dataPath} ${err.message}.`;
	} else if (err.keyword === 'uniqueItems') {
		return `${dataPath} should not contain the item '${err.data[err.params.i]}' twice.`;
	} else if (err.keyword === 'minLength' || err.keyword === 'minItems' || err.keyword === 'minProperties') {
		if (err.params.limit === 1) {
			return `${dataPath} should not be empty.`;
		} else {
			return `${dataPath} ${err.message}`;
		}
	} else {
		return `${dataPath} ${err.message}`;
	}
}

function getValidateable(commandMaps: Map<string, Map<string, CommandWrapper>>) {
	let toValidate = new Set<CommandWrapper>();
	commandMaps.forEach((commandMap) => {
		[...commandMap.values()].forEach((command) => {
			if (typeof command.validate === 'function') {
				toValidate.add(command);
			}
		});
	});
	return [...toValidate];
}

export function builtInCommandValidation(validation: ValidationWrapper): Promise<any> {
	return new Promise((resolve) => {
		const { commandGroup, commandName, commandSchema, commandConfig, silentSuccess } = validation;
		const commandKey = `${commandGroup}-${commandName}`; // group and name are required properties

		if (validation.commandConfig === undefined) {
			resolve(true);
			return;
		}

		const mismatches = getValidationErrors(commandKey, commandConfig, commandSchema);
		const valid = mismatches.length === 0;

		if (!valid) {
			logValidationFailed(commandKey);
			mismatches.forEach((mismatch) => {
				logSchemaErrors(mismatch);
			});
		} else {
			!silentSuccess && logSchemaSuccess(commandKey);
		}

		resolve(valid);
	});
}

async function validateCommands(
	commands: Map<string, Map<string, CommandWrapper>>,
	helper: HelperFactory
): Promise<boolean> {
	const config = getConfig();

	const noConfig = config === undefined;
	const emptyConfig = typeof config === 'object' && Object.keys(config).length === 0;
	if (noConfig) {
		logNoConfig();
		return true;
	} else if (emptyConfig) {
		logEmptyConfig();
		return true;
	}

	const commandsToValidate = getValidateable(commands);
	if (commandsToValidate.length === 0) {
		logNoValidatableCommands();
		return true;
	}

	const commandValidations = commandsToValidate.map((command) => {
		const validate = command.validate as (helper: Helper) => Promise<boolean>;
		return validate(helper.sandbox(command.group, command.name)).catch((error) => {
			logValidateFunctionFailed(error);
			return false;
		});
	});

	// Wait for all validations to resolve and check if all commands are valid
	return Promise.all(commandValidations).then((validations) => {
		const allValid = validations.every((validation) => validation);
		if (allValid) {
			logConfigValidateSuccess();
		}
		return allValid;
	});
}

function run(helper: Helper, args: ValidateArgs): Promise<boolean> {
	return loadExternalCommands().then((commands) => {
		const helperContext = {};
		const commandHelper = new CommandHelper(commands, helperContext, configurationHelperFactory);
		const validateHelper = { validate: builtInCommandValidation };
		const helperFactory = new HelperFactory(
			commandHelper,
			args,
			helperContext,
			configurationHelperFactory,
			validateHelper
		);

		return validateCommands(commands, helperFactory);
	});
}

export default {
	name: '',
	group: 'validate',
	description: 'validate your .dojorc configuration file for installed commands',
	register,
	global: false,
	run
};
