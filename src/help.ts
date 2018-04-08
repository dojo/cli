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

function createPadding(text: string, paddingLength: number, paddingChar = ' '): string {
	return sliceAnsi(paddingChar.repeat(paddingLength), 0, paddingLength - stringWidth(text));
}

function formatHeader(group: string = '<group>', command: string = '[<command>]') {
	return `${dojoArt}
${chalk.bold('Usage:')}

  $ ${chalk.green('dojo')} ${chalk.green(group)} ${chalk.dim.green(command)} [<options>] [--help]`;
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
		let groupOutput = `  ${chalk.green(group)} ${createPadding(group, 8)}`;
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
			groupOutput = `${groupOutput}  ${chalk.dim.green(name)}`;
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

	register(
		(key, options) => {
			let optionKeys = `${addOptionPrefix(chalk.green(key))}`;
			if (options.alias) {
				const aliases = Array.isArray(options.alias) ? options.alias : [options.alias];
				optionKeys = aliases.reduce((result, alias) => {
					if (alias.length === 1) {
						return `${addOptionPrefix(chalk.green(alias))}, ${result}`;
					}
					return `${result}, ${addOptionPrefix(chalk.green(alias))}`;
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
	if (!argv._ || argv._.length === 0) {
		return formatMainHelp(groupMap);
	} else if (argv._.length === 1) {
		return formatGroupHelp(groupMap, argv._[0]);
	}
	return formatCommandHelp(groupMap, argv._[0], argv._[1]);
}
