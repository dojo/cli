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
			const commandWrapper = {
				name: command.commandName,
				group: group.groupName,
				description: compositeKey,
				register: stub().returns(compositeKey),
				run: stub().returns(command.fails ?
					Promise.reject(new Error(compositeKey)) :
					Promise.resolve(compositeKey))
			};
			commands.set(compositeKey, commandWrapper);
		});
	});

	return commands;
};
