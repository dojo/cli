import chalk from 'chalk';
import { Options } from 'yargs';
import { GroupMap } from './interfaces';
import { getCommand } from './command';

function isRequired(options: Options) {
	return options.demand || options.demandOption || options.require || options.requiresArg || options.required;
}

export function optionValidator(groupMap: GroupMap) {
	return (argv: any, aliases: any) => {
		if (argv.h || argv.help || argv._.length === 0) {
			return true;
		}
		const groupName: string = argv._[0];
		const commandName: string = argv._[1];
		let validationError = '';

		const command = getCommand(groupMap, groupName, commandName);

		command.register(
			(key, options) => {
				if (argv[key] === undefined && isRequired(options)) {
					if (validationError) {
						validationError = `\n${validationError}`;
					}
					validationError = `${validationError}Required key '${chalk.redBright(key)}' not provided`;
				}
			},
			null as any
		);
		if (validationError) {
			throw new Error(validationError);
		}
		return true;
	};
}
