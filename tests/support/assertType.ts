import AssertionError = require('assertion-error');
import { TypeWriterResult } from './TypeWriter';
import { find } from '@dojo/shim/array';

function assert(expr: any, message?: string, expected?: any, actual?: any, showDiff?: boolean, ssi?: any): void {
	if (!expr) {
		throw new AssertionError(
			message || '',
			{
				actual,
				expected,
				showDiff
			},
			ssi
		);
	}
}

function contains(typeBundle: TypeWriterResult[], name: string, description?: string): void {
	assert(typeBundle.some((result) => result.sourceText === name), description);
}

function isType(
	typeBundle: TypeWriterResult[],
	name: string,
	type: string,
	description?: string,
	ssi: any = isType
): void {
	const typeResult = find(typeBundle, (result) => result.sourceText === name);
	assert(
		typeResult && typeResult.type === type,
		`Unexpected type. Expected: "${type}" Actual: "${typeResult && typeResult.type}"${
			description ? `. ${description}` : ''
		}`,
		type,
		typeResult && typeResult.type,
		true,
		ssi
	);
}

function isBoolean(typeBundle: TypeWriterResult[], name: string, description?: string): void {
	isType(typeBundle, name, 'boolean', description, isBoolean);
}

function isString(typeBundle: TypeWriterResult[], name: string, description?: string): void {
	isType(typeBundle, name, 'string', description, isString);
}

function isError(typeBundle: TypeWriterResult[], name: string, description?: string): void {
	isType(typeBundle, name, 'Error', description, isError);
}

export default {
	contains,
	isBoolean,
	isError,
	isString,
	isType
};
