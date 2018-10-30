import { CommandWrapper } from '../../src/interfaces';
import { stub, spy, SinonStub } from 'sinon';

export type GroupDef = {
	groupName: string;
	commands: {
		commandName: string;
		fails?: boolean;
		exitCode?: number;
	}[];
}[];

export interface CommandWrapperConfig {
	group?: string;
	name?: string;
	description?: string;
	path?: string;
	runs?: boolean;
	eject?: boolean;
	installed?: boolean;
	global?: boolean;
	validate?: () => boolean;
}

export function getGroupMap(groupDef: GroupDef, registerMock?: Function, validate?: boolean) {
	const groupMap = new Map();
	if (registerMock === undefined) {
		registerMock = (compositeKey: string) => {
			const registerStub = stub();
			registerStub.yields('key', {}).returns(compositeKey);
			return registerStub;
		};
	}
	let isDefault = false;
	groupDef.forEach((group) => {
		let commandMap = groupMap.get(group.groupName);
		if (!commandMap) {
			commandMap = new Map();
			groupMap.set(group.groupName, commandMap);
			isDefault = true;
		}
		group.commands.forEach((command) => {
			const compositeKey = `${group.groupName}-${command.commandName}`;
			const error = new Error('test error message');
			if (command.exitCode) {
				(error as any).exitCode = command.exitCode;
			}
			const runSpy = spy(() => (command.fails ? Promise.reject(error) : Promise.resolve(compositeKey)));
			const commandWrapper: any = {
				name: command.commandName,
				group: group.groupName,
				description: compositeKey,
				register: registerMock!(compositeKey),
				runSpy,
				default: isDefault,
				run: runSpy,
				validate: undefined
			};
			if (validate) {
				commandWrapper.validate = validate;
			}
			isDefault = false;
			commandMap.set(command.commandName, commandWrapper);
		});
	});

	return groupMap;
}

const yargsFunctions = ['demand', 'usage', 'epilog', 'help', 'alias', 'strict', 'option', 'check', 'showHelpOnFail'];
export function getYargsStub(aliases: any = {}) {
	const yargsStub: any = {
		parsed: {
			aliases
		}
	};
	yargsFunctions.forEach((fnc) => {
		yargsStub[fnc] = stub().returns(yargsStub);
	});
	yargsStub.command = stub()
		.callsArgWith(2, yargsStub)
		.returns(yargsStub);
	return yargsStub;
}

export function getCommandWrapper(name: string, runs: boolean = true) {
	return getCommandWrapperWithConfiguration({
		name,
		runs,
		group: 'foo',
		description: 'test-description'
	});
}

export function getCommandWrapperWithConfiguration(config: CommandWrapperConfig): CommandWrapper {
	const {
		group = '',
		name = '',
		description = '',
		path = '',
		runs = false,
		eject = false,
		global = false,
		installed = false,
		validate
	} = config;

	const commandWrapper: CommandWrapper = {
		group,
		name,
		description,
		path,
		global,
		installed,
		register: stub().returns('registered'),
		run: stub().returns(runs ? 'success' : 'error')
	};

	if (validate) {
		commandWrapper.validate = validate;
	}

	if (eject) {
		commandWrapper.eject = stub().returns({});
	}

	return commandWrapper;
}

export interface LoggingStub {
	info: SinonStub;
	log: SinonStub;
	warn: SinonStub;
	error: SinonStub;
}

export function getLoggingStub(): LoggingStub {
	return {
		info: stub(),
		log: stub(),
		warn: stub(),
		error: stub()
	};
}
