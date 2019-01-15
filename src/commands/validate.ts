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

export function getValidationErrors(commandKey: string, commandConfig: any, commandSchema: any): string[] {
	const ajv = new Ajv({ allErrors: true });

	const validate = ajv.compile(commandSchema);
	validate(commandConfig);

	let errors: string[] = [];
	if (validate.errors) {
		errors = validate.errors.map((err: any) => {
			let message = `${commandKey} - config${err.dataPath} ${err.message}`;
			if (err.keyword === 'enum') {
				return `${message}: ${err.params.allowedValues.join(', ')}`;
			}
			return message;
		});
	}

	return errors;
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

		const mismatches = getValidationErrors(commandKey, commandConfig, commandSchema);
		const valid = mismatches.length === 0;

		if (!valid) {
			logSchemaErrors('Config is invalid! The following issues were found: ');
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
