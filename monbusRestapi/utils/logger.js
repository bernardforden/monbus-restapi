const monbusRestapi = require('debug')('monbusRestapi')
exports.info = monbusRestapi.extend('INFO')
exports.warn = monbusRestapi.extend('WARNING')
exports.error = monbusRestapi.extend('ERROR')
exports.debug = monbusRestapi.extend('DEBUG')

if (typeof global.__stack === 'undefined') {
    Object.defineProperty(global, '__stack', {
        get: function () {
            var orig = Error.prepareStackTrace;
            Error.prepareStackTrace = function (_, stack) {
                return stack;
            };
            var err = new Error;
            Error.captureStackTrace(err, arguments.callee);
            var stack = err.stack;
            Error.prepareStackTrace = orig;
            return stack;
        }
    });
}

if (typeof global.__line === 'undefined') {
    Object.defineProperty(global, '__line', {
        get: function () {
            return __stack[1].getLineNumber();
        }
    });
}

if (typeof global.__function === 'undefined') {
    Object.defineProperty(global, '__function', {
        get: function () {
            return __stack[1].getFunctionName();
        }
    });
}

require('debug').enable(process.env.DEBUG || 'monbusRestapi:INFO,monbusRestapi:WARNING,monbusRestapi:ERROR')