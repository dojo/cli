import { Args } from './interfaces';

type Builtin = 'eject' | 'help' | 'validate';
const builtinCommands: Builtin[] = ['eject', 'help', 'validate'];

export default function handleDojoCommand() {
	const noCommands = process.argv.length <= 2;
	if (noCommands) {
		// Call formatHelp
	} else {
		const args = process.argv.slice(2);
		handleArguments(args);
	}
}

export function handleArguments(args: string[]) {
	const { builtin, group, command, flags } = processArgs(args);

	if (isHelp(builtin, flags)) {
		console.log('call help');
		return;
	}

	if (builtin) {
		handleBuiltin(command as Builtin);
	} else if (group) {
		console.log('call group command with args');
	} else if (command) {
		console.log('call specific command with args');
	}
}

export function handleBuiltin(command: Builtin) {
	switch (command) {
		case 'eject':
			console.log('call eject');
			break;

		case 'validate':
			console.log('call validate');
			break;
	}
}

export function isHelp(builtin: boolean, flags: { [flag: string]: string[] }) {
	return builtin && (flags['-h'] !== undefined || flags['--help'] !== undefined);
}

export function processArgs(args: string[]): Args {
	const commands: string[] = [];
	const flags: any = {};
	let isBuiltin = false;

	let arg;
	let lastFlag = '';
	let isFlagArg = false;
	while ((arg = args.pop())) {
		if (arg.startsWith('-')) {
			flags[arg] = [];
			lastFlag = arg;
			isFlagArg = true;
		} else if (isFlagArg && lastFlag) {
			flags[lastFlag].push(arg);
		} else if (commands.length < 2) {
			commands.push(arg);
		}
	}

	if (commands.length === 1) {
		if (builtinCommands.indexOf(commands[0] as Builtin) !== -1) {
			isBuiltin = true;
		}
	}

	return {
		builtin: isBuiltin,
		group: commands[0],
		command: commands[1],
		flags
	};
}
