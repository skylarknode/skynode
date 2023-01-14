'use strict';

var fs = require('fs');
var childProcess = require('child_process');

var fork = require('../meta/debugFork');
var paths = require('../helpers/paths');

var dirname = paths.baseDir;

function getRunningPid(expected,callback) {
	fs.readFile(paths.pidfile, {
		encoding: 'utf-8',
	}, function (err, pid) {
		if (err) {
			if (expected) {
				return callback(err);
			} else {
				return callback(null,0);
			}
		}

		pid = parseInt(pid, 10);

		try {
			process.kill(pid, 0);
			callback(null, pid);
		} catch (e) {
			if (expected) {
				return callback(e);
			} else {
				return callback(null,0);
			}
		}
	});
}

function _start(options) {
	if (options.dev) {
		process.env.NODE_ENV = 'development';
		fork(paths.loader, ['--no-daemon', '--no-silent'], {
			env: process.env,
			cwd: dirname,
			stdio: 'inherit',
		});
		return;
	}
	if (options.log) {
		console.log('\n' + [
			'Starting SkyBB with logging output'.bold,
			'Hit '.red + 'Ctrl-C '.bold + 'to exit'.red,
			'The SkyBB process will continue to run in the background',
			'Use "' + './skybb stop'.yellow + '" to stop the SkyBB server',
		].join('\n'));
	} else if (!options.silent) {
		console.log('\n' + [
			'Starting SkyBB'.bold,
			'  "' + './skybb stop'.yellow + '" to stop the SkyBB server',
			'  "' + './skybb log'.yellow + '" to view server output',
			'  "' + './skybb help'.yellow + '" for more commands\n'.reset,
		].join('\n'));
	}

	// Spawn a new SkyBB process
	console.log("paths.loader:" + paths.loader);
	var child = fork(paths.loader, process.argv.slice(3), {
		env: process.env,
		cwd: dirname,
	});
	if (options.log) {
		childProcess.spawn('tail', ['-F', './logs/output.log'], {
			cwd: dirname,
			stdio: 'inherit',
		});
	}

	return child;
}

function start(options) {
	getRunningPid(false,function (err, pid) {
		if (!pid) {
			console.log('\nRestarting SkyBB'.bold);
			_start(options);
		} else {
			console.warn('SkyBB is already started!');
		}
	});
}

function stop() {
	getRunningPid(true,function (err, pid) {
		if (!err) {
			process.kill(pid, 'SIGTERM');
			console.log('Stopping SkyBB. Goodbye!');
		} else {
			console.log('SkyBB is already stopped.');
		}
	});
}

function restart(options) {
	getRunningPid(true,function (err, pid) {
		if (!err) {
			console.log('\nRestarting SkyBB'.bold);
			process.kill(pid, 'SIGTERM');

			options.silent = true;
			_start(options);
		} else {
			console.warn('SkyBB could not be restarted, as a running instance could not be found.');
		}
	});
}

function status() {
	getRunningPid(function (err, pid) {
		if (!err) {
			console.log('\n' + [
				'SkyBB Running '.bold + ('(pid ' + pid.toString() + ')').cyan,
				'\t"' + './skybb stop'.yellow + '" to stop the SkyBB server',
				'\t"' + './skybb log'.yellow + '" to view server output',
				'\t"' + './skybb restart'.yellow + '" to restart SkyBB\n',
			].join('\n'));
		} else {
			console.log('\nSkyBB is not running'.bold);
			console.log('\t"' + './skybb start'.yellow + '" to launch the SkyBB server\n'.reset);
		}
	});
}

function log() {
	console.log('\nHit '.red + 'Ctrl-C '.bold + 'to exit\n'.red + '\n'.reset);
	childProcess.spawn('tail', ['-F', './logs/output.log'], {
		cwd: dirname,
		stdio: 'inherit',
	});
}

exports.start = start;
exports.stop = stop;
exports.restart = restart;
exports.status = status;
exports.log = log;
