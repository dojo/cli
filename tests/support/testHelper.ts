import {CommandWrapper} from '../../src/command';
import { stub } from 'sinon';

export type GroupDef = [{
	groupName: string;
	commands: [{
		commandName: string;
		fails?: boolean;
	}]
}];

export interface CommandWrapperConfig {
	group?: string;
	name?: string;
	description?: string;
	path?: string;
	runs?: boolean;
}

export function getCommandsMap(groupDef: GroupDef, withOptions?: boolean) {
	const commands = new Map();

	groupDef.forEach((group) => {
		group.commands.forEach((command) => {
			const compositeKey = `${group.groupName}-${command.commandName}`;
			const runStub = stub();
			const commandWrapper = {
				name: command.commandName,
				group: group.groupName,
				description: compositeKey,
				register: (withOptions ?
					stub().callsArgWith(0, 'key', {}) :
					stub()).returns(compositeKey),
				runStub,
				run: runStub.returns(command.fails ?
					Promise.reject(new Error(compositeKey)) :
					Promise.resolve(compositeKey))
			};
			commands.set(compositeKey, commandWrapper);
		});
	});

	return commands;
};

const yargsFunctions = [ 'demand', 'usage', 'epilog', 'help', 'alias', 'strict', 'option' ];
export function getYargsStub() {
	const yargsStub: any = {};
	yargsFunctions.forEach((fnc) => {
		yargsStub[fnc] = stub().returns(yargsStub);
	});
	yargsStub.command = stub().callsArgWith(2, yargsStub).returns(yargsStub);
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
	const {group = '', name = '', description = '', path = '', runs = false} = config;

	const commandWrapper = {
		group,
		name,
		description,
		path,
		register: stub().returns('registered'),
		run: stub().returns(runs ? Promise.resolve('success') : Promise.reject(new Error()))
	};

	return commandWrapper;
}
