import { Argv } from 'yargs';
import chalk from 'chalk';
import { CommandWrapper, Helper, OptionsHelper, Config } from '../interfaces';
import { loadExternalCommands } from '../allCommands';
import { getConfigFile } from '../configurationHelper';

import { Validator } from 'jsonschema';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const { red, green } = chalk;

export const VALIDATION_FILENAME = 'rc-schema.json';

export interface ValidateArgs extends Argv {}

export interface ValidateableCommandWrapper extends CommandWrapper {
	validate(helper: Helper): any;
}

export function isValidateableCommandWrapper(object: CommandWrapper): object is ValidateableCommandWrapper {
	return typeof object.validate === 'function';
}

function register(options: OptionsHelper): void {}

export function loadValidationSchema(path: string) {
	const configExists = !!path && existsSync(path);
	if (configExists) {
		try {
			return JSON.parse(readFileSync(path, 'utf8'));
		} catch (error) {
			throw new Error(`Error reading schema file: ${error}`);
		}
	}
	throw new Error(`Schema file does not exist on filesystem. Path tried was: ${path}`);
}

type ValidationErrors = string[];

export function validate(config: any, schema: any): ValidationErrors {
	const validator = new Validator();
	const result = validator.validate(config, schema);
	let errors: any = [];

	if (result.errors.length === 0) {
		return errors;
	}

	errors = result.errors.map((err: any) => {
		let message = err.stack;
		message = message.replace(' enum ', ' expected ');
		message = message.replace('instance.', 'config.');
		return message;
	});

	return errors;
}

export function logSchemaErrors(mismatch: string) {
	console.log(red(mismatch));
}

export function logSchemaSuccess(commandName: string) {
	console.log(green(`${commandName} command config validation was successful!`));
}

export function logConfigValidateSuccess() {
	console.log(green(`There were no issues with your config!`));
}

export function getConfigPath(command: ValidateableCommandWrapper) {
	return join(command.path, VALIDATION_FILENAME);
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

export function validateCommand(command: ValidateableCommandWrapper, config: Config, silentSuccess: boolean): boolean {
	const path = getConfigPath(command);
	const schema = loadValidationSchema(path);
	const mismatches = validate(config, schema);
	let noMismatches = true;

	if (mismatches.length) {
		noMismatches = false;
		mismatches.forEach((mismatch) => {
			logSchemaErrors(mismatch);
		});
	} else {
		!silentSuccess && logSchemaSuccess(command.name);
	}
	return noMismatches;
}

function validateCommands(commands: Map<string, Map<string, CommandWrapper>>) {
	const config = getConfigFile();
	const noConfig = config === undefined;
	const emptyConfig = typeof config === 'object' && Object.keys(config).length === 0;

	if (noConfig || emptyConfig) {
		return;
	}

	const toValidate = createValidationCommandSet(commands);

	if (toValidate.size === 0) {
		return;
	}

	let noMismatches = true;

	[...toValidate].forEach((command) => {
		noMismatches = validateCommand(command, config, false) && noMismatches;
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
