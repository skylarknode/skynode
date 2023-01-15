'use strict';
console.log("loader1");
require("amd-loader");

var fs = require('fs');
var url = require('url');
var path = require('path');
var fork = require('child_process').fork;
var async = require('async');
var logrotate = require('logrotate-stream');
var mkdirp = require('mkdirp');

var pkg = require('../../package.json');
var paths = require('../helpers/paths');

require(paths.baseDir + "/system");
var	nconf = system.require('skynode-basis/system/configures');
var file = system.require('skynode-basis/file');


//console.log("process.env.NODEBB_CONFIG:" + process.env.NODEBB_CONFIG);

//var pathToConfig = path.resolve(__dirname, process.env.NODEBB_CONFIG);


//nconf.argv().env();

nconf.argv().env().file({
	file: paths.config
});

var	pidFilePath = paths.pidfile;///path.join(__dirname, '../../pidfile');

var outputLogFilePath = path.join(paths.baseDir,nconf.get('logFile') || 'logs/output.log'); ///(__dirname, nconf.get('logFile') || '../../logs/output.log');

var logDir = path.dirname(outputLogFilePath);
if (!fs.existsSync(logDir)) {
	mkdirp.sync(path.dirname(outputLogFilePath));
}

var output = logrotate({ file: outputLogFilePath, size: '1m', keep: 3, compress: true });
var silent = nconf.get('silent') === 'false' ? false : nconf.get('silent') !== false;
var numProcs;
var workers = [];
var Loader = {
	timesStarted: 0,
};
var appPath = path.join(__dirname, 'worker.js'); //'app.js'); by lwf

Loader.init = function (callback) {
	console.error("silent:" + silent);
	if (silent) {
		console.log = function () {
			var args = Array.prototype.slice.call(arguments);
			output.write(args.join(' ') + '\n');
		};
	}

	process.on('SIGHUP', Loader.restart);
	process.on('SIGTERM', Loader.stop);
	callback();
};

Loader.displayStartupMessages = function (callback) {
	console.log('');
	console.log('NodeBB v' + pkg.version + ' Copyright (C) 2013-2014 NodeBB Inc.');
	console.log('This program comes with ABSOLUTELY NO WARRANTY.');
	console.log('This is free software, and you are welcome to redistribute it under certain conditions.');
	console.log('For the full license, please visit: http://www.gnu.org/copyleft/gpl.html');
	console.log('');
	callback();
};

Loader.addWorkerEvents = function (worker) {
	worker.on('exit', function (code, signal) {
		if (code !== 0) {
			if (Loader.timesStarted < numProcs * 3) {
				Loader.timesStarted += 1;
				if (Loader.crashTimer) {
					clearTimeout(Loader.crashTimer);
				}
				Loader.crashTimer = setTimeout(function () {
					Loader.timesStarted = 0;
				}, 10000);
			} else {
				console.log((numProcs * 3) + ' restarts in 10 seconds, most likely an error on startup. Halting.');
				process.exit();
			}
		}

		console.log('[cluster] Child Process (' + worker.pid + ') has exited (code: ' + code + ', signal: ' + signal + ')');
		if (!(worker.suicide || code === 0)) {
			console.log('[cluster] Spinning up another process...');

			forkWorker(worker.index, worker.isPrimary);
		}
	});

	worker.on('message', function (message) {
		if (message && typeof message === 'object' && message.action) {
			switch (message.action) {
			case 'restart':
				console.log('[cluster] Restarting...');
				Loader.restart();
				break;
			case 'pubsub':
				workers.forEach(function (w) {
					w.send(message);
				});
				break;
			case 'socket.io':
				workers.forEach(function (w) {
					if (w !== worker) {
						w.send(message);
					}
				});
				break;
			}
		}
	});
};

Loader.start = function (callback) {
	numProcs = getPorts().length;
	console.log('Clustering enabled: Spinning up ' + numProcs + ' process(es).\n');

	for (var x = 0; x < numProcs; x += 1) {
		forkWorker(x, x === 0);
	}

	if (callback) {
		callback();
	}
};

function forkWorker(index, isPrimary) {
	var ports = getPorts();
	var args = [];

	if (!ports[index]) {
		return console.log('[cluster] invalid port for worker : ' + index + ' ports: ' + ports.length);
	}

	process.env.isPrimary = isPrimary;
	process.env.isCluster = nconf.get('isCluster') || ports.length > 1;
	process.env.port = ports[index];

	var worker = fork(appPath, args, {
		silent: silent,
		env: process.env,
		cwd: paths.baseDir
	});

	worker.index = index;
	worker.isPrimary = isPrimary;

	workers[index] = worker;

	Loader.addWorkerEvents(worker);

	if (silent) {
		var output = logrotate({ file: outputLogFilePath, size: '1m', keep: 3, compress: true });
		worker.stdout.pipe(output);
		worker.stderr.pipe(output);
	}
}

function getPorts() {
	var port = nconf.get('PORT') || nconf.get('port') || 4567;
	if (!Array.isArray(port)) {
		port = [port];
	}
	return port;
}

Loader.restart = function () {
	killWorkers();
	Loader.start();

	/*

	nconf.remove('file');
	nconf.use('file', { file: paths.config });

	fs.readFile(paths.config, { encoding: 'utf-8' }, function (err, configFile) {
		if (err) {
			console.error('Error reading config');
			throw err;
		}

		var conf = JSON.parse(configFile);

		nconf.stores.env.readOnly = false;
		nconf.set('url', conf.url);
		nconf.stores.env.readOnly = true;

		if (process.env.url !== conf.url) {
			process.env.url = conf.url;
		}
		Loader.start();
	});
	*/
};

Loader.stop = function () {
	killWorkers();

	// Clean up the pidfile
	if (nconf.get('daemon') !== 'false' && nconf.get('daemon') !== false) {
		fs.unlinkSync(pidFilePath);
	}
};

function killWorkers() {
	workers.forEach(function (worker) {
		worker.suicide = true;
		worker.kill();
	});
}

fs.open(paths.config, 'r', function (err) {
	if (err) {
		// No config detected, kickstart web installer
		console.log("err:" + err);

		fork('app');
		return;
	}
    console.log("loader3");
	if (nconf.get('daemon') !== 'false' && nconf.get('daemon') !== false) {
		console.log("loader3.1");
		if (file.existsSync(pidFilePath)) {
			try {
				var	pid = fs.readFileSync(pidFilePath, { encoding: 'utf-8' });
				process.kill(pid, 0);
				process.exit();
			} catch (e) {
				
				fs.unlinkSync(pidFilePath);
			}
		}
		console.log("loader3.2");

		require('daemon')({
			stdout: process.stdout,
			stderr: process.stderr,
			cwd: process.cwd(),
		});
		console.log("loader3.3");
		fs.writeFileSync(pidFilePath, process.pid.toString());
	}

	console.log("loader4");

	async.series([
		Loader.init,
		Loader.displayStartupMessages,
		Loader.start,
	], function (err) {
		if (err) {
			console.error('[loader] Error during startup');
			throw err;
		}
	});
});
