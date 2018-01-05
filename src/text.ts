import chalk from 'chalk';

export const helpUsage = `${chalk.bold('dojo help')}

Usage: dojo <group> <command> [options]

Hey there, here are all the things you can do with @dojo/cli:`;

export function helpEpilog(installableCommands: any[]): string {
	let installableCommandNames =  chalk.red('No command list available at this time');
	if (installableCommands.length) {
		installableCommandNames = installableCommands.map(command => {
			return `  ${chalk.green(command.name)} - ${command.description}`;
		}).join('\n');
	}

	return `Installable Commands:
${installableCommandNames}

For more information on any of these commands just run them with '-h'.

e.g. 'dojo build -h' will give you the help for the 'build' group of commands.

If a non-builtin command (e.g. build) appears missing from the command list, please ensure it is listed in package.json and correctly installed.`;

}
