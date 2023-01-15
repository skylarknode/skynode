'use strict';

var nfs = require('skynode-nfs');
var nconf = require('skynode-basis/system/configures');

var Logs = module.exports;


//Logs.path = path.join(__dirname, '..', '..', 'logs', 'output.log');
Logs.path = nfs.join(nconf.get('base_dir'), 'logs', 'output.log');

Logs.get = function (callback) {
	nfs.readFile(Logs.path, {
		encoding: 'utf-8',
	}, callback);
};

Logs.clear = function (callback) {
	nfs.truncate(Logs.path, 0, callback);
};
