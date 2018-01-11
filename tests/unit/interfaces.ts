const { registerSuite } = intern.getInterface('object');
import { getTypeForFiles } from '../support/util';
import assertType from '../support/assertType';

registerSuite('interfaces.d', {
	'validate types'() {
		const file = 'src/interfaces.d.ts';
		const types = getTypeForFiles(file);
		const cliTypes = types[file];
		assertType.isType(cliTypes, 'Config', 'Config');
		assertType.isType(cliTypes, 'ConfigurationHelper', 'ConfigurationHelper');
		assertType.isType(cliTypes, 'CommandHelper', 'CommandHelper');
		assertType.isType(cliTypes, 'Helper', 'Helper');
		assertType.isType(cliTypes, 'OptionsHelper', 'OptionsHelper');
		assertType.isType(cliTypes, 'NpmPackage', 'NpmPackage');
		assertType.isType(cliTypes, 'Alias', 'Alias');
		assertType.isType(cliTypes, 'AliasOption', 'AliasOption');
		assertType.isType(cliTypes, 'FileCopyConfig', 'FileCopyConfig');
		assertType.isType(cliTypes, 'EjectOutput', 'EjectOutput');
		assertType.isType(cliTypes, 'Command', 'Command<T>');
		assertType.isType(cliTypes, 'CommandError', 'CommandError');
	}
});
