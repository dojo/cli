import { bold } from 'chalk';
const pkg = <any> require('../package.json');

export const helpUsage = `${bold('dojo help')}

Usage: dojo <command> [subCommand] [options]

Hey there, here are all the things you can do with dojo-cli:`;

export const helpEpilog = `For more information on any of these commands just run them with '-h'.

e.g. 'dojo run -h' will give you the help for the 'run' command.

(You are running dojo-cli ${pkg.version})`;
