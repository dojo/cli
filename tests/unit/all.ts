import * as winston from 'winston';
winston.remove(winston.transports.Console);

import './util/index';
import './commands/create';
