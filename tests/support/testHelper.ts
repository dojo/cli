import { stub } from 'sinon';
export type GroupDef = [{
	groupName: string;
	commands: [{
		commandName: string;
		fails?: boolean;
	}]
}];

export function getCommandsMap(groupDef: GroupDef) {
	const commands = new Map();

	groupDef.forEach((group) => {
		group.commands.forEach((command) => {
			const compositeKey = `${group.groupName}-${command.commandName}`;
			const runStub = stub();
			const commandWrapper = {
				name: command.commandName,
				group: group.groupName,
				description: compositeKey,
				register: stub().returns(compositeKey),
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

const yargsFunctions = [ 'demand', 'usage', 'epilog', 'help', 'alias', 'strict' ];
export function getYargsStub() {
	const yargsStub: any = {};
	yargsFunctions.forEach((fnc) => {
		yargsStub[fnc] = stub().returns(yargsStub);
	});
	yargsStub.command = stub().callsArgWith(2, yargsStub).returns(yargsStub);
	return yargsStub;
}

export function getCommandWrapper(name: string, runs: boolean = true) {
	const commandWrapper = {
		group: 'foo',
		name,
		description: 'test-description',
		register: stub().returns('registered'),
		run: stub().returns(runs ? Promise.resolve('success') : Promise.reject(new Error()))
	};
	return commandWrapper;
}
