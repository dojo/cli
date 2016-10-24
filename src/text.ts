import { bold, yellow } from 'chalk';

export const helpUsage = `${bold('dojo help')}

Usage: dojo <group> <command> [options]

Hey there, here are all the things you can do with dojo-cli:`;

export const helpEpilog = `For more information on any of these commands just run them with '-h'.

e.g. 'dojo run -h' will give you the help for the 'run' group of commands.`;

export const versionCurrentVersion = `
You are currently running dojo-cli {version}
`;

export const versionDescription = 'List versions of registered commands';

export const versionNoRegisteredCommands = `
There are no registered commands available.`;

export const versionNoVersion = yellow('package.json missing');

export const versionRegisteredCommands = `
The currently installed groups are:
`;
