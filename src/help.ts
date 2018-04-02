import { GroupMap, CommandWrapper } from './interfaces';
import chalk from 'chalk';
import { isRequiredOption } from './validation';

const stringWidth = require('string-width');
const sliceAnsi = require('slice-ansi');
const figlet = require('figlet');

function fillPlaceholder(char: string = ' ', length: number = 10) {
	return char.repeat(length);
}

function formatHeader(group: string = '<group>', command: string = '[<command>]') {
	return `${figlet.textSync('DOJO')}
${chalk.bold('Usage:')}

  ${chalk.dim.gray('$')} ${chalk.green('dojo')} ${chalk.green(group)} ${chalk.dim.green(command)} [<options>] [--help]`;
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function isGlobalCommand(commandWrapper: CommandWrapper): boolean {
	return commandWrapper.installed && commandWrapper.global;
}

function isProjectCommand(commandWrapper: CommandWrapper): boolean {
	return commandWrapper.installed && !commandWrapper.global;
}

function isInstalledCommand(commandWrapper: CommandWrapper): boolean {
	return commandWrapper.installed;
}

function isInstalledCommandForGroup(group: string) {
	return (commandWrapper: CommandWrapper) => {
		return isInstalledCommand(commandWrapper) && commandWrapper.group === group;
	};
}

function isNpmCommand(commandWrapper: CommandWrapper): boolean {
	return !commandWrapper.installed;
}

function formatHelpOutput(
	groupMap: GroupMap,
	commandPredicate: (commandWrapper: CommandWrapper) => boolean,
	showDefault = false
) {
	let output = '';
	let hasGroup = false;
	let commandOptionHelp = '';
	groupMap.forEach((commandMap, group) => {
		let groupOutput = `  ${chalk.green(group)} ${chalk.dim.gray(
			sliceAnsi(fillPlaceholder(' ', 8), 0, 8 - stringWidth(group))
		)}`;
		if (hasGroup) {
			groupOutput = `\n${groupOutput}`;
		}

		let hasCommand = false;
		const filteredCommandMap = [...commandMap.values()].filter(commandPredicate);
		filteredCommandMap.forEach((commandWrapper) => {
			if (hasCommand) {
				groupOutput = `${groupOutput}\n${' '.repeat(11)}`;
			}
			groupOutput = `${groupOutput}  ${chalk.dim.green(commandWrapper.name)}`;
			groupOutput = `${groupOutput}${chalk.dim.gray(
				sliceAnsi(fillPlaceholder(), 0, 10 - stringWidth(commandWrapper.name))
			)}`;
			groupOutput = `${groupOutput}  ${capitalize(commandWrapper.description)}`;
			if (commandWrapper.default && showDefault && filteredCommandMap.length > 1) {
				groupOutput = `${groupOutput} (Default)`;
			}
			groupOutput = `${groupOutput}`;
			hasCommand = true;
			if (commandWrapper.default && showDefault) {
				commandOptionHelp = `\n${formatCommandOptions(commandWrapper)}`;
			}
		});
		if (hasCommand) {
			output = `${output}${groupOutput}`;
			hasGroup = true;
		}
	});

	if (commandOptionHelp) {
		output = `${output}\n${commandOptionHelp}`;
	}
	return output;
}

function formatCommandOptions(commandWrapper: CommandWrapper, isDefaultCommand = true) {
	const { register } = commandWrapper;
	let commandOptionHelp = `${chalk.bold(`Command Options:`)}\n`;
	if (isDefaultCommand) {
		commandOptionHelp = `${chalk.bold('Default Command Options')}\n`;
	}

	register(
		(key, options) => {
			let optionKeys;
			if (options.alias) {
				if (options.alias.length < key.length) {
					optionKeys = `  -${options.alias}, --${chalk.green(key)}`;
				} else {
					optionKeys = `  -${chalk.green(key)}, --${options.alias}`;
				}
			} else {
				optionKeys = `  --${key}`;
			}
			commandOptionHelp = `${commandOptionHelp}\n${optionKeys}`;
			commandOptionHelp = `${commandOptionHelp} ${chalk.dim.gray(
				sliceAnsi(fillPlaceholder(' ', 20), 0, 20 - stringWidth(optionKeys))
			)}`;
			if (options.describe) {
				commandOptionHelp = `${commandOptionHelp}${capitalize(options.describe)}`;
			}
			if (options.choices) {
				commandOptionHelp = `${commandOptionHelp} [choices: "${options.choices.join('", "')}"]`;
			}
			if (isRequiredOption(options)) {
				commandOptionHelp = `${commandOptionHelp} [Required]`;
			}
		},
		null as any
	);
	return commandOptionHelp;
}

function formatMainHelp(groupMap: GroupMap) {
	return `${formatHeader()}

${chalk.bold('Global Commands:')}

${formatHelpOutput(groupMap, isGlobalCommand)}

${chalk.bold('Project Commands:')}

${formatHelpOutput(groupMap, isProjectCommand)}

${chalk.bold('Installable Commands:')}

${formatHelpOutput(groupMap, isNpmCommand)}
`;
}

function formatGroupHelp(groupMap: GroupMap, group: string) {
	return `${formatHeader(group)}

${chalk.bold('Commands:')}

${formatHelpOutput(groupMap, isInstalledCommandForGroup(group), true)}
`;
}

function formatCommandHelp(groupMap: GroupMap, group: string, command: string) {
	const commandWrapper = groupMap.get(group)!.get(command)!;
	return `${formatHeader(group, command)}

${chalk.bold('Description:')}

${'  '}${capitalize(commandWrapper.description)}

${formatCommandOptions(commandWrapper, false)}
`;
}

function unknownGroupHelp() {
	return `${formatHeader()}`;
}

export function formatHelp(argv: any, groupMap: GroupMap): string {
	if (!argv._ || argv._.length === 0) {
		return formatMainHelp(groupMap);
	} else if (argv._.length === 1) {
		if (groupMap.has(argv._[0])) {
			return formatGroupHelp(groupMap, argv._[0]);
		}
		return unknownGroupHelp();
	}
	return formatCommandHelp(groupMap, argv._[0], argv._[1]);
}
