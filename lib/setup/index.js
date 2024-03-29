'use strict';

var winston = require('winston');
var async = require('async');
var path = require('path');
var nconf = system.require('skynode-basis/system/parameters');

var install = require('./web').install;

function setup(initConfig) {
	var paths = require('../cli/paths');
	var install = require('./install');
	var build = require('../meta/build');
	///var prestart = require('../cli/prestart');
	var pkg = require('../../package.json');

	winston.info('SkyBB Setup Triggered via Command Line');

	console.log('\nWelcome to SkyBB v' + pkg.version + '!');
	console.log('\nThis looks like a new installation, so you\'ll have to answer a few questions about your environment before we can proceed.');
	console.log('Press enter to accept the default setting (shown in brackets).');

	install.values = initConfig;

	async.series([
		install.setup,
		function (next) {
			///var configFile = paths.config;
			///if (nconf.get('config')) {
			///	configFile = path.resolve(paths.baseDir, nconf.get('config'));
			///}

			///prestart.loadConfig(configFile);
			next();
		},
		build.buildAll,
	], function (err, data) {
		// Disregard build step data
		data = data[0];

		var separator = '     ';
		if (process.stdout.columns > 10) {
			for (var x = 0, cols = process.stdout.columns - 10; x < cols; x += 1) {
				separator += '=';
			}
		}
		console.log('\n' + separator + '\n');

		if (err) {
			winston.error('There was a problem completing SkyBB setup', err);
			throw err;
		} else {
			if (data.hasOwnProperty('password')) {
				console.log('An administrative user was automatically created for you:');
				console.log('    Username: ' + data.username + '');
				console.log('    Password: ' + data.password + '');
				console.log('');
			}
			console.log('SkyBB Setup Completed. Run "./skybb start" to manually start your SkyBB server.');

			// If I am a child process, notify the parent of the returned data before exiting (useful for notifying
			// hosts of auto-generated username/password during headless setups)
			if (process.send) {
				process.send(data);
			}
		}

		process.exit();
	});
}

exports.setup = setup;
exports.webInstall = install;
