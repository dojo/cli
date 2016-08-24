import * as yargs from 'yargs';
import updateNotifier from './updateNotifier';
import config from './config';
import register from './register';
import { load, setSearchPrefix } from './command';
const pkg = <any> require('../../package.json');

updateNotifier(pkg, 0);
setSearchPrefix(config.searchPrefix);
register(config, yargs, load);
