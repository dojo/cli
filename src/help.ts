import { GroupMap, CommandWrapper } from './interfaces';
import chalk from 'chalk';
import { isRequiredOption } from './validation';
import { Options } from 'yargs';

const stringWidth = require('string-width');
const sliceAnsi = require('slice-ansi');

const dojoArt = `
            ..
          ';,,'..
          .colllc,.                         .''''''...           .,,,.        ..         .,,,.
        ...',:loooc.       ...''''''..      ;x'      ;;'      ':;,'.'',:;.    :o.    .:;,'..',;:.
      .'''.     ....     .',;'..   ..'.     'l'       .c:    :c.        ,l'   ,l.   ,l'        'l;
     .,,,.            ..;::,'..      ';.    'l'        .l,  ,l.          :c.  ,l.  .l,          'l.
  .'..;;,.          .,:cc;'...       ,:'    'l'        .l;  :l.          ,l.  ,l.  'l.          .l,
   ...;;;.       .':clc;.           .;:.    'l'        ,l.  'l'          c:   ,l.  .l;          ;l.
      .:c:,..',:coooc,.           .';;'     'l'      .;c'    'c,.      .c:.   ,l.   .c:.      .;c.
       .:okOOkkxo:,..   ........',,,'.      ,o:,,,,,,;'.        ;;,,,,;;      ,l.     ';;,,,,;;'
       .''',;;,..  ....   ........                                            ,l.
                   ',    .''.                                                .c:
                   .'.. .;c;.                                                ..
                     ..   .`;

function addOptionPrefix(optionKey: string): string {
	return stringWidth(optionKey) === 1 ? `-${optionKey}` : `--${optionKey}`;
}

function getOptionDescription(options: Options): string | undefined {
	if (options.describe) {
		return options.describe;
	}
	if (options.description) {
		return options.description;
	}
	if (options.desc) {
		return options.desc;
	}
	if (options.defaultDescription) {
		return options.defaultDescription;
	}
	return undefined;
}

export function createPadding(text: string, paddingLength: number, paddingChar = ' '): string {
	return sliceAnsi(paddingChar.repeat(paddingLength), 0, paddingLength - stringWidth(text));
}

function formatHeader(group: string = '<group>', command: string = '[<command>]') {
	return `${chalk.blueBright(dojoArt)}
${chalk.bold('Usage:')}

  $ ${chalk.greenBright('dojo')} ${chalk.greenBright(group)} ${chalk.green(command)} [<options>] [--help]`;
}

function capitalize(value: string) {
	return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function isGlobalCommand(commandWrapper: CommandWrapper): boolean {
	return commandWrapper.installed && commandWrapper.global;
}

function isProjectCommand(commandWrapper: CommandWrapper): boolean {
	return commandWrapper.installed && !commandWrapper.global;
}

function isCommandForGroup(group: string) {
	return (commandWrapper: CommandWrapper) => {
		return commandWrapper.group === group;
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
		let groupOutput = `  ${chalk.greenBright(group)} ${createPadding(group, 8)}`;
		if (hasGroup) {
			groupOutput = `\n${groupOutput}`;
		}

		let hasCommand = false;
		const filteredCommandMap = [...commandMap.values()].filter(commandPredicate);
		filteredCommandMap.forEach((commandWrapper) => {
			const { name, description, default: isDefault } = commandWrapper;
			if (hasCommand) {
				groupOutput = `${groupOutput}\n${' '.repeat(11)}`;
			}
			groupOutput = `${groupOutput}  ${chalk.green(name)}`;
			groupOutput = `${groupOutput}${createPadding(name, 10)}`;
			groupOutput = `${groupOutput}  ${capitalize(description)}`;
			if (isDefault && showDefault && filteredCommandMap.length > 1) {
				groupOutput = `${groupOutput} (Default)`;
			}
			hasCommand = true;
			if (isDefault && showDefault) {
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

	if (!commandWrapper.installed) {
		return `${commandOptionHelp}\n  To install this command run ${chalk.green(`${commandWrapper.path}`)}`;
	}

	function formatOption(key: string, options: Options) {
		let optionKeys = `${addOptionPrefix(chalk.greenBright(key))}`;
		if (options.alias) {
			const aliases = Array.isArray(options.alias) ? options.alias : [options.alias];
			optionKeys = aliases.reduce((result, alias) => {
				if (alias.length === 1) {
					return `${addOptionPrefix(chalk.greenBright(alias))}, ${result}`;
				}
				return `${result}, ${addOptionPrefix(chalk.greenBright(alias))}`;
			}, optionKeys);
		}
		commandOptionHelp = `${commandOptionHelp}\n  ${optionKeys}`;
		commandOptionHelp = `${commandOptionHelp} ${createPadding(optionKeys, 20)}`;
		const description = getOptionDescription(options);
		if (description) {
			commandOptionHelp = `${commandOptionHelp}${capitalize(description)}`;
		}
		if (options.choices) {
			commandOptionHelp = `${commandOptionHelp} [choices: "${options.choices
				.map((choice: any) => chalk.yellow(choice))
				.join('", "')}"]`;
		}
		if (options.default) {
			commandOptionHelp = `${commandOptionHelp} [default: "${chalk.yellow(options.default)}"]`;
		}
		if (options.type) {
			commandOptionHelp = `${commandOptionHelp} [type: "${chalk.yellow(options.type)}"]`;
		}
		if (isRequiredOption(options)) {
			commandOptionHelp = `${commandOptionHelp} [${chalk.yellow('required')}]`;
		}
	}

	register(formatOption, null as any);
	formatOption('force', { type: 'boolean', description: 'Continue running commands even if validation fails' });
	formatOption('dojorc', { default: '.dojorc', type: 'string', description: 'The dojorc config file' });
	return commandOptionHelp;
}

function formatMainHelp(groupMap: GroupMap) {
	return `${formatHeader()}
${mainHelp(groupMap)}
`;
}

function mainHelp(groupMap: GroupMap) {
	return `
${chalk.bold('Global Commands:')}

${formatHelpOutput(groupMap, isGlobalCommand)}

${chalk.bold('Project Commands:')}

${formatHelpOutput(groupMap, isProjectCommand)}

${chalk.bold('Installable Commands:')}

${formatHelpOutput(groupMap, isNpmCommand)}
`;
}

function formatMissingCommandHelp(groupMap: GroupMap, fullCommand: string) {
	const nonexistant = chalk.bold(
		chalk.red(`Specified command '`) +
			chalk.redBright(fullCommand) +
			chalk.red(`' does not exist, please see available commands below.`)
	);
	return `${formatHeader()}

${nonexistant}
${mainHelp(groupMap)}
`;
}

function formatGroupHelp(groupMap: GroupMap, group: string) {
	return `${formatHeader(group)}

${chalk.bold('Commands:')}

${formatHelpOutput(groupMap, isCommandForGroup(group), true)}
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

export function formatHelp(argv: any, groupMap: GroupMap): string {
	const commands = argv._ && argv._.length > 0;

	if (!commands) {
		return formatMainHelp(groupMap);
	}

	const isGroup = argv._.length === 1;
	const [group, command] = argv._;
	const hasGroup = groupMap.get(group);
	const hasCommand = hasGroup && hasGroup.get(command);

	if (isGroup) {
		if (hasGroup) {
			return formatGroupHelp(groupMap, group);
		}
		return formatMissingCommandHelp(groupMap, group);
	}

	if (hasGroup && hasCommand) {
		return formatCommandHelp(groupMap, group, command);
	}

	return formatMissingCommandHelp(groupMap, `${group} ${command}`);
}
