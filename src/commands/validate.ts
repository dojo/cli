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
	console.log(red(mismatch));
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

export function getValidationErrors(commandConfig: any, commandSchema: any): string[] {
	const ajv = new Ajv({ allErrors: true, verbose: true });

	const validate = ajv.compile(commandSchema);
	validate(commandConfig);

	let errors = [];

	if (validate.errors) {
		errors = filterErrors(validate.errors).map((error) => {
			return formatValidationErrors(commandSchema, error);
		});
	}

	return errors;
}

// anyOf will also list the individual erros, we need to account for this
function filterAnyOf(errors: any[]) {
	let anyOfPath: string;
	const hasAnyOf = errors.some((err) => {
		if (err.keyword === 'anyOf') {
			anyOfPath = err.schemaPath;
			return true;
		}
		return false;
	});

	return hasAnyOf
		? errors.filter((err) => {
				if (err.schemaPath.startsWith(anyOfPath) && err.keyword !== 'anyOf') {
					return false;
				}
				return true;
		  })
		: errors;
}

function filterErrors(errors: any[]) {
	return filterAnyOf(errors);
}

function formatSchema(schemaToFormat: any, prevSchemas?: any): any {
	prevSchemas = prevSchemas || [];

	const formatInnerSchema = (innerSchema: any, addSelf?: boolean) => {
		if (!addSelf) {
			return formatSchema(innerSchema, prevSchemas);
		}
		if (prevSchemas.includes(innerSchema)) {
			return '(recursive)';
		}
		return formatSchema(innerSchema, prevSchemas.concat(schemaToFormat));
	};

	if (schemaToFormat.oneOf) {
		return schemaToFormat.oneOf.map(formatInnerSchema).join(' | ');
	}
	if (schemaToFormat.$ref) {
		return formatInnerSchema(schemaToFormat.$ref, true);
	}
	if (schemaToFormat.allOf) {
		return schemaToFormat.allOf.map(formatInnerSchema).join(' & ');
	}
	if (schemaToFormat.anyOf) {
		return schemaToFormat.anyOf.map(formatInnerSchema).join(' | ');
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
	if (schemaToFormat.type === 'object') {
		if (schemaToFormat.properties) {
			const required = schemaToFormat.required || [];
			return `object { ${Object.keys(schemaToFormat.properties)
				.map((property) => {
					if (!required.includes(property)) {
						return property + '?';
					}
					return property;
				})
				.concat(schemaToFormat.additionalProperties ? ['…'] : [])
				.join(', ')} }`;
		}
		if (schemaToFormat.additionalProperties) {
			return `object { <key>: ${formatInnerSchema(schemaToFormat.additionalProperties)} }`;
		}
		return 'object';
	}
	if (schemaToFormat.type === 'array') {
		return `[${formatInnerSchema(schemaToFormat.items)}]`;
	}

	return JSON.stringify(schemaToFormat, null, 2);
}

// function indent(str: string, prefix: string, firstLine: boolean) {
// 	if (firstLine) {
// 		return prefix + str.replace(/\n(?!$)/g, "\n" + prefix);
// 	} else {
// 		return str.replace(/\n(?!$)/g, `\n${prefix}`);
// 	}
// };

// function getSchemaPart(schema: any, path: string, parents?: number, additionalPath?: string) {
// 	parents = parents || 0;
// 	let pathArr = path.split("/");
// 	pathArr = pathArr.slice(0, pathArr.length - parents);
// 	if (additionalPath) {
// 		pathArr = pathArr.concat(additionalPath.split("/"));
// 	}
// 	let schemaPart = schema;
// 	for (let i = 1; i < pathArr.length; i++) {
// 		const inner = schemaPart[pathArr[i]];
// 		if (inner) {
// 			schemaPart = inner;
// 		}
// 	}
// 	return schemaPart;
// };

// function getSchemaPartText(commandSchema: any, schemaPart: any, additionalPath?: any[]): string {
// 	if (additionalPath) {
// 		for (let i = 0; i < additionalPath.length; i++) {
// 			const inner = schemaPart[additionalPath[i]];
// 			if (inner) {
// 				schemaPart = inner;
// 			}
// 		}
// 	}
// 	while (schemaPart.$ref) {
// 		schemaPart = getSchemaPart(commandSchema, schemaPart.$ref);
// 	}
// 	let schemaText = formatSchema(commandSchema, schemaPart);
// 	if (schemaPart.description) {
// 		schemaText += `\n-> ${schemaPart.description}`;
// 	}
// 	return schemaText;
// };

// function getSchemaPartDescription(schema: any, schemaPart: any): string {
// 	while (schemaPart.$ref) {
// 		schemaPart = getSchemaPart(schema, schemaPart.$ref);
// 	}
// 	if (schemaPart.description) {
// 		return `\n-> ${schemaPart.description}`;
// 	}
// 	return "";
// };

// function filterChildren(children: any) {
// 	return children.filter((err: any) =>
// 			err.keyword !== "anyOf" &&
// 			err.keyword !== "allOf" &&
// 			err.keyword !== "oneOf"
// 	);
// };

function formatValidationErrors(commandSchema: any, err: any): any {
	const dataPath = `configuration${err.dataPath}`;

	if (err.keyword === 'additionalProperties') {
		return `${dataPath} has an unknown property '${err.params.additionalProperty}'.`;
	} else if (err.keyword === 'oneOf' || err.keyword === 'anyOf') {
		return `${dataPath} should be one of these:\n${formatSchema(err.parentSchema)}`;
	} else if (err.keyword === 'enum') {
		if (err.parentSchema && err.parentSchema.enum && err.parentSchema.enum.length === 1) {
			return `${dataPath} should be ${formatSchema(err.parentSchema)}`;
		}

		return `${dataPath} should be one of these:\n${formatSchema(err.parentSchema)}`;
	} else if (err.keyword === 'allOf') {
		return `${dataPath} should be:\n${formatSchema(err.parentSchema)}`;
	} else if (err.keyword === 'type') {
		switch (err.params.type) {
			case 'object':
				return `${dataPath} should be an object.`;
			case 'string':
				return `${dataPath} should be a string.`;
			case 'boolean':
				return `${dataPath} should be a boolean.`;
			case 'number':
				return `${dataPath} should be a number.`;
			case 'array':
				return `${dataPath} should be an array.`;
		}

		return `${dataPath} should be ${err.params.type}`;
	} else if (err.keyword === 'required') {
		const missingProperty = err.params.missingProperty.replace(/^\./, '');
		return `${dataPath} misses the property '${missingProperty}'.`;
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

function getValdatableCommands(commandMaps: Map<string, Map<string, CommandWrapper>>) {
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
			logSchemaErrors(`.dojorc config does not have the top level command property '${commandKey}'`);
			resolve(false);
			return;
		}

		const mismatches = getValidationErrors(commandConfig, commandSchema);
		const valid = mismatches.length === 0;

		if (!valid) {
			logSchemaErrors(`${commandKey} config is invalid! The following issues were found: `);
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

	const commandsToValidate = getValdatableCommands(commands);
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
