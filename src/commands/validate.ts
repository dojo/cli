import { Argv } from 'yargs';
import chalk from 'chalk';
import { CommandWrapper, Helper, OptionsHelper, ValidationWrapper } from '../interfaces';
import { loadExternalCommands } from '../allCommands';
import configurationHelperFactory, { getConfigFile } from '../configurationHelper';
import { Validator } from 'jsonschema';
import CommandHelper from '../CommandHelper';
import HelperFactory from '../Helper';

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
	const validator = new Validator();
	const result = validator.validate(commandConfig, commandSchema);

	const errors = result.errors.map((err: any) => {
		let message = err.stack;
		message = message.replace(' enum ', ' expected ');
		message = message.replace('instance', `${commandKey} config`);
		return message;
	});

	return errors;
}

function createValidationCommandSet(commandMaps: Map<string, Map<string, CommandWrapper>>) {
	let toValidate = new Set<CommandWrapper>();
	commandMaps.forEach((commandMap) => {
		[...commandMap.values()].forEach((command) => {
			if (typeof command.validate === 'function') {
				toValidate.add(command);
			}
		});
	});
	return toValidate;
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

function validateCommands(commands: Map<string, Map<string, CommandWrapper>>, helper: HelperFactory) {
	const config = getConfigFile();

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
		try {
			const valid = !!command.validate && command.validate(helper.sandbox(command.group, command.name));
			noMismatches = valid && noMismatches;
		} catch (error) {
			logValidateFunctionFailed(error);
			noMismatches = false;
		}
	});

	if (noMismatches) {
		logConfigValidateSuccess();
	}
}

function run(helper: Helper, args: ValidateArgs): Promise<any> {
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

		validateCommands(commands, helperFactory);
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
