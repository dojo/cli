import { Argv } from 'yargs';
import chalk from 'chalk';
import { CommandWrapper, Helper, OptionsHelper, Config } from '../interfaces';
import { loadExternalCommands } from '../allCommands';
import { getConfigFile } from '../configurationHelper';

import { Validator } from 'jsonschema';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const { red, green, yellow } = chalk;

export const VALIDATION_FILENAME = 'command-schema.json';

export interface ValidateArgs extends Argv {}

type ValidationErrors = string[];

export interface ValidateableCommandWrapper extends CommandWrapper {
	validate: boolean;
}

export function isValidateableCommandWrapper(object: CommandWrapper): object is ValidateableCommandWrapper {
	return object.validate === true;
}

function register(options: OptionsHelper): void {}

export function loadValidationSchema(path: string) {
	const configExists = !!path && existsSync(path);
	if (configExists) {
		try {
			return JSON.parse(readFileSync(path, 'utf8'));
		} catch (error) {
			throw new Error(`Error reading command schema file (${path}): ${error}`);
		}
	}
	throw new Error(`Schema file does not exist on filesystem. Path tried was: ${path}`);
}

export function logNoConfig() {
	console.log(yellow(`No config has been detected`));
}

export function logMalformedConfig() {
	console.log(red(`A config was found, but it was not valid JSON`));
}

export function logEmptyConfig() {
	console.log(yellow(`A config was found, but it has no properties`));
}

export function logSchemaErrors(mismatch: string) {
	console.log(red(mismatch));
}

export function logSchemaSuccess(commandName: string) {
	console.log(green(`${commandName} config validation was successful!`));
}

export function logConfigValidateSuccess() {
	console.log(green(`There were no issues with your config!`));
}

export function logNoValidatableCommands() {
	console.log(green(`There were no commands to validate against`));
}

export function getConfigPath(command: ValidateableCommandWrapper) {
	return join(command.path, VALIDATION_FILENAME);
}

export function getValidationErrors(commandKey: string, commandConfig: any, schema: any): ValidationErrors {
	const validator = new Validator();
	const result = validator.validate(commandConfig, schema);
	let errors: any = [];

	if (result.errors.length === 0) {
		return errors;
	}

	errors = result.errors.map((err: any) => {
		let message = err.stack;
		message = message.replace(' enum ', ' expected ');
		message = message.replace('instance', `${commandKey} config`);
		return message;
	});

	return errors;
}

function createValidationCommandSet(commands: Map<string, Map<string, CommandWrapper>>) {
	let toValidate = new Set<ValidateableCommandWrapper>();
	commands.forEach((commandMap, group) => {
		toValidate = [...commandMap.values()].reduce((toValidate, command) => {
			if (isValidateableCommandWrapper(command)) {
				toValidate.add(command);
			}
			return toValidate;
		}, toValidate);
	});
	return toValidate;
}

export function validateCommand(
	command: ValidateableCommandWrapper,
	commandConfig: any,
	silentSuccess: boolean
): boolean {
	const path = getConfigPath(command);
	const schema = loadValidationSchema(path);
	const commandKey = command.group + '-' + command.name; // group and name are required properties

	if (commandConfig === undefined) {
		logSchemaErrors(`.dojorc config does not have the top level command property '${commandKey}'`);
		return false;
	}
	const mismatches = getValidationErrors(commandKey, commandConfig, schema);
	let noMismatches = true;

	if (mismatches.length) {
		noMismatches = false;
		mismatches.forEach((mismatch) => {
			logSchemaErrors(mismatch);
		});
	} else {
		!silentSuccess && logSchemaSuccess(commandKey);
	}
	return noMismatches;
}

function validateCommands(commands: Map<string, Map<string, CommandWrapper>>) {
	let config: any;
	try {
		config = getConfigFile();
	} catch (e) {
		logMalformedConfig();
		return;
	}
	const noConfig = config === undefined;
	const emptyConfig = typeof config === 'object' && Object.keys(config).length === 0;
	if (noConfig) {
		logNoConfig();
		return;
	} else if (emptyConfig) {
		logEmptyConfig();
		return;
	}

	const toValidate = createValidationCommandSet(commands);

	if (toValidate.size === 0) {
		logNoValidatableCommands();
		return;
	}

	let noMismatches = true;

	[...toValidate].forEach((command) => {
		noMismatches = validateCommand(command, config as Config, false) && noMismatches;
	});

	if (noMismatches) {
		logConfigValidateSuccess();
	}
}

async function run(helper: Helper, args: ValidateArgs): Promise<any> {
	return loadExternalCommands().then(async (commands) => {
		validateCommands(commands);
	});
}

export default {
	name: '',
	group: 'validate',
	description: 'validate your .dojorc build for installed commands',
	register,
	global: false,
	run
};
