/**
 * This module is adapted from [Microsoft/TypeScript/src/harness/typeWrite.ts](https://github.com/Microsoft/TypeScript/blob/9f73ae59035b17ff7498d1e2d968137f06404d82/src/harness/typeWriter.ts)
 *
 * TypeScript is Copyright (c) Microsoft Corporation. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use
 * this file except in compliance with the License. You may obtain a copy of the
 * License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
 * WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
 * MERCHANTABLITY OR NON-INFRINGEMENT.
 *
 * See the Apache Version 2.0 License for specific language governing permissions
 * and limitations under the License.
 */

import * as ts from 'typescript';
import {
	Node,
	SyntaxKind,
	JsxOpeningLikeElement,
	VariableLikeDeclaration,
	ExpressionStatement,
	ForStatement,
	ForInStatement,
	ForOfStatement,
	AssertionExpression,
	TemplateSpan,
	ComputedPropertyName,
	ExpressionWithTypeArguments,
	ClassLikeDeclaration,
	HeritageClause
} from 'typescript';
const { assert } = intern.getPlugin('chai');

function isClassLike(node: Node): node is ClassLikeDeclaration {
	return node && (node.kind === SyntaxKind.ClassDeclaration || node.kind === SyntaxKind.ClassExpression);
}

function tryGetClassExtendingExpressionWithTypeArguments(node: Node): ClassLikeDeclaration | undefined {
	if (
		node.kind === SyntaxKind.ExpressionWithTypeArguments &&
		(<HeritageClause> node.parent).token === SyntaxKind.ExtendsKeyword &&
		node.parent &&
		node.parent.parent &&
		isClassLike(node.parent.parent)
	) {
		return node.parent.parent;
	}
}

function isExpressionWithTypeArgumentsInClassExtendsClause(node: Node): boolean {
	return tryGetClassExtendingExpressionWithTypeArguments(node) !== undefined;
}

function isJSXTagName(node: Node) {
	const parent = node.parent;
	if (
		(parent && parent.kind === SyntaxKind.JsxOpeningElement) ||
		(parent && parent.kind === SyntaxKind.JsxSelfClosingElement) ||
		(parent && parent.kind === SyntaxKind.JsxClosingElement)
	) {
		return (<JsxOpeningLikeElement> parent).tagName === node;
	}
	return false;
}

function isPartOfExpression(node: Node | undefined): boolean {
	if (!node) {
		return false;
	}
	switch (node.kind) {
		case SyntaxKind.ThisKeyword:
		case SyntaxKind.SuperKeyword:
		case SyntaxKind.NullKeyword:
		case SyntaxKind.TrueKeyword:
		case SyntaxKind.FalseKeyword:
		case SyntaxKind.RegularExpressionLiteral:
		case SyntaxKind.ArrayLiteralExpression:
		case SyntaxKind.ObjectLiteralExpression:
		case SyntaxKind.PropertyAccessExpression:
		case SyntaxKind.ElementAccessExpression:
		case SyntaxKind.CallExpression:
		case SyntaxKind.NewExpression:
		case SyntaxKind.TaggedTemplateExpression:
		case SyntaxKind.AsExpression:
		case SyntaxKind.TypeAssertionExpression:
		case SyntaxKind.NonNullExpression:
		case SyntaxKind.ParenthesizedExpression:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.ClassExpression:
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.VoidExpression:
		case SyntaxKind.DeleteExpression:
		case SyntaxKind.TypeOfExpression:
		case SyntaxKind.PrefixUnaryExpression:
		case SyntaxKind.PostfixUnaryExpression:
		case SyntaxKind.BinaryExpression:
		case SyntaxKind.ConditionalExpression:
		case SyntaxKind.TemplateExpression:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.OmittedExpression:
		case SyntaxKind.JsxElement:
		case SyntaxKind.JsxSelfClosingElement:
		case SyntaxKind.YieldExpression:
		case SyntaxKind.AwaitExpression:
			return true;
		case SyntaxKind.QualifiedName:
			while (node.parent && node.parent.kind === SyntaxKind.QualifiedName) {
				node = node.parent;
			}
			return (node.parent && node.parent.kind === SyntaxKind.TypeQuery) || isJSXTagName(node);
		case SyntaxKind.Identifier:
			if ((node.parent && node.parent.kind === SyntaxKind.TypeQuery) || isJSXTagName(node)) {
				return true;
			}
		// fall through
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.StringLiteral:
		case SyntaxKind.ThisKeyword:
			let parent = node.parent;
			switch (parent && parent.kind) {
				case SyntaxKind.VariableDeclaration:
				case SyntaxKind.Parameter:
				case SyntaxKind.PropertyDeclaration:
				case SyntaxKind.PropertySignature:
				case SyntaxKind.EnumMember:
				case SyntaxKind.PropertyAssignment:
				case SyntaxKind.BindingElement:
					return (<VariableLikeDeclaration> parent).initializer === node;
				case SyntaxKind.ExpressionStatement:
				case SyntaxKind.IfStatement:
				case SyntaxKind.DoStatement:
				case SyntaxKind.WhileStatement:
				case SyntaxKind.ReturnStatement:
				case SyntaxKind.WithStatement:
				case SyntaxKind.SwitchStatement:
				case SyntaxKind.CaseClause:
				case SyntaxKind.ThrowStatement:
				case SyntaxKind.SwitchStatement:
					return (<ExpressionStatement> parent).expression === node;
				case SyntaxKind.ForStatement:
					let forStatement = <ForStatement> parent;
					return (
						(forStatement.initializer === node &&
							forStatement.initializer.kind !== SyntaxKind.VariableDeclarationList) ||
						forStatement.condition === node ||
						forStatement.incrementor === node
					);
				case SyntaxKind.ForInStatement:
				case SyntaxKind.ForOfStatement:
					let forInStatement = <ForInStatement | ForOfStatement> parent;
					return (
						(forInStatement.initializer === node &&
							forInStatement.initializer.kind !== SyntaxKind.VariableDeclarationList) ||
						forInStatement.expression === node
					);
				case SyntaxKind.TypeAssertionExpression:
				case SyntaxKind.AsExpression:
					return node === (<AssertionExpression> parent).expression;
				case SyntaxKind.TemplateSpan:
					return node === (<TemplateSpan> parent).expression;
				case SyntaxKind.ComputedPropertyName:
					return node === (<ComputedPropertyName> parent).expression;
				case SyntaxKind.Decorator:
				case SyntaxKind.JsxExpression:
				case SyntaxKind.JsxSpreadAttribute:
					return true;
				case SyntaxKind.ExpressionWithTypeArguments:
					return (
						((<ExpressionWithTypeArguments> parent).expression === node &&
							(parent && isExpressionWithTypeArgumentsInClassExtendsClause(parent))) ||
						false
					);
				default:
					if (parent && isPartOfExpression(parent)) {
						return true;
					}
			}
	}
	return false;
}

export interface TypeWriterResult {
	line: number;
	syntaxKind: number;
	sourceText: string;
	type: string;
	symbol: string;
}

/* There are several <any> casts in here, because many of the internal diagnostic APIs are stripped out of the typescript
 * type definitions when the compiler is generated, which does mean these could easily break in the future */

export default class TypeWriterWalker {
	results: TypeWriterResult[];
	currentSourceFile: ts.SourceFile;

	private checker: ts.TypeChecker;

	/* tslint:disable */
	constructor(private program: ts.Program, fullTypeCheck: boolean) {
		// Consider getting both the diagnostics checker and the non-diagnostics checker to verify
		// they are consistent.
		this.checker = fullTypeCheck
			? <ts.TypeChecker>(<any>program).getDiagnosticsProducingTypeChecker()
			: program.getTypeChecker();
	}
	/* tslint:enable */

	public getTypeAndSymbols(fileName: string): TypeWriterResult[] {
		const sourceFile = this.program.getSourceFile(fileName);
		this.currentSourceFile = sourceFile;
		this.results = [];
		this.visitNode(sourceFile);
		return this.results;
	}

	private visitNode(node: Node | undefined): void {
		if (!node) {
			return;
		}
		if (isPartOfExpression(node) || node.kind === ts.SyntaxKind.Identifier) {
			this.logTypeAndSymbol(node);
		}

		ts.forEachChild(node, (child) => this.visitNode(child));
	}

	private logTypeAndSymbol(node: ts.Node): void {
		const actualPos: number = (<any> ts).skipTrivia(this.currentSourceFile.text, node.pos);
		const lineAndCharacter = this.currentSourceFile.getLineAndCharacterOfPosition(actualPos);
		const sourceText: string = (<any> ts).getTextOfNodeFromSourceText(this.currentSourceFile.text, node);

		// Workaround to ensure we output 'C' instead of 'typeof C' for base class expressions
		// let type = this.checker.getTypeAtLocation(node);
		const type =
			(node.parent &&
				(<any> ts).isExpressionWithTypeArgumentsInClassExtendsClause(node.parent) &&
				this.checker.getTypeAtLocation(node.parent)) ||
			this.checker.getTypeAtLocation(node);

		assert.isDefined(type, `type doesn't exist`);
		const symbol = this.checker.getSymbolAtLocation(node);

		const typeString = this.checker.typeToString(type, node.parent, ts.TypeFormatFlags.NoTruncation);
		let symbolString = '';
		if (symbol) {
			symbolString = 'Symbol(' + this.checker.symbolToString(symbol, node.parent);
			if (symbol.declarations) {
				for (const declaration of symbol.declarations) {
					symbolString += ', ';
					const declSourceFile = declaration.getSourceFile();
					const declLineAndCharacter = declSourceFile.getLineAndCharacterOfPosition(declaration.pos);
					const fileName: string = (<any> ts).getBaseFileName(declSourceFile.fileName);
					const isLibFile = /lib(.*)\.d\.ts/i.test(fileName);
					symbolString += `Decl(${fileName}, ${isLibFile ? '--' : declLineAndCharacter.line}, ${
						isLibFile ? '--' : declLineAndCharacter.character
					})`;
				}
			}
			symbolString += ')';
		}

		this.results.push({
			line: lineAndCharacter.line,
			syntaxKind: node.kind,
			sourceText: sourceText,
			type: typeString,
			symbol: symbolString
		});
	}
}
