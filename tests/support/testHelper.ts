import { CommandWrapper } from '../../src/interfaces';
import { stub, spy } from 'sinon';

export type GroupDef = {
	groupName: string;
	commands: {
		commandName: string;
		fails?: boolean;
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
}

export function getGroupMap(groupDef: GroupDef, registerMock?: Function) {
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
			const runSpy = spy(
				() => (command.fails ? Promise.reject(new Error('test error message')) : Promise.resolve(compositeKey))
			);
			const commandWrapper = {
				name: command.commandName,
				group: group.groupName,
				description: compositeKey,
				register: registerMock!(compositeKey),
				runSpy,
				default: isDefault,
				run: runSpy
			};
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
		installed = false
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

	if (eject) {
		commandWrapper.eject = stub().returns({});
	}

	return commandWrapper;
}
