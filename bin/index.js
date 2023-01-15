'use strict';

require("amd-loader");

var nfs = require('skynode-nfs');

var winston = require('winston');
var nconf = require('skynode-basis/system/configures');


var dirname = require('../lib/helpers/paths').baseDir,
	configFile = require('../lib/helpers/paths').config;

var pkg = require('../package.json');
var file = require('skynode-basis/file');
var paths = require('../lib/helpers/paths');


function setupWinston() {
	if (!winston.format) {
		return;
	}

	// allow winton.error to log error objects properly
	// https://github.com/SkyBB/SkyBB/issues/6848
	const winstonError = winston.error;
	winston.error = function (msg, error) {
		console.log("winston.error:" + msg);
		if (msg instanceof Error) {
			winstonError(msg);
		} else if (error instanceof Error) {
			msg = msg + '\n' + error.stack;
			winstonError(msg);
		} else {
			winstonError.apply(null, arguments);
		}
	};


	// https://github.com/winstonjs/winston/issues/1338
	// error objects are not displayed properly
	const enumerateErrorFormat = winston.format((info) => {
		if (info.message instanceof Error) {
			info.message = Object.assign({
				message: `${info.message.message}\n${info.message.stack}`,
			}, info.message);
		}

		if (info instanceof Error) {
			return Object.assign({
				message: `${info.message}\n${info.stack}`,
			}, info);
		}

		return info;
	});
	var formats = [];
	formats.push(enumerateErrorFormat());
	if (nconf.get('log-colorize') !== 'false') {
		formats.push(winston.format.colorize());
	}

	if (nconf.get('json-logging')) {
		formats.push(winston.format.timestamp());
		formats.push(winston.format.json());
	} else {
		const timestampFormat = winston.format((info) => {
			var dateString = new Date().toISOString() + ' [' + nconf.get('port') + '/' + global.process.pid + ']';
			info.level = dateString + ' - ' + info.level;
			return info;
		});
		formats.push(timestampFormat());
		formats.push(winston.format.splat());
		formats.push(winston.format.simple());
	}

	winston.configure({
		level: nconf.get('log-level') || (global.env === 'production' ? 'info' : 'verbose'),
		format: winston.format.combine.apply(null, formats),
		transports: [
			new winston.transports.Console({
				handleExceptions: true,
				level: 'error'  // add by lwf
			}),
			new winston.transports.Console({
				handleExceptions: true,
				level: 'info'  // add by lwf
			}),
		],
	});
}

function setupConfig() {
	nconf.argv().env({
		separator: '__',
	});

	nconf.file({
		file: paths.config
	});

	

	nconf.defaults({
		base_dir: dirname,
		themes_path: nfs.join(dirname, 'node_modules'),
		upload_path: 'uploads',	
		views_dir: nfs.join(dirname, 'build/public/templates'),
		version: pkg.version
	});

	if (!nconf.get('isCluster')) {
		nconf.set('isPrimary', 'true');
		nconf.set('isCluster', 'false');
	}
	var isPrimary = nconf.get('isPrimary');
	nconf.set('isPrimary', isPrimary === undefined ? 'true' : isPrimary);

	// Ensure themes_path is a full filepath
	nconf.set('themes_path', nfs.resolve(dirname, nconf.get('themes_path')));
	//nconf.set('core_templates_path', nfs.join(dirname, 'src/views'));
	nconf.set('core_templates_path', nfs.join(dirname, 'slax/src/templates'));
	nconf.set('base_templates_path', nfs.join(nconf.get('themes_path'), 'nodebb-theme-persona/templates'));

	nconf.set('upload_path', nfs.resolve(nconf.get('base_dir'), nconf.get('upload_path')));
}

// check to make sure dependencies are installed
if (!nfs.existsSync(nfs.join(dirname, 'package.json'))){
	console.warn('package.json not found.');
	console.log('Populating package.json...');

	packageInstall.updatePackageFile();
	packageInstall.preserveExtraneousPlugins();
}

require('colors');
var program = require('commander');


program
	.name('snode')
	.description('Welcome to SkyNode')
	.version(pkg.version)
	.option('--json-logging', 'Output to logs in JSON format', false)
	.option('--log-level <level>', 'Default logging level to use', 'info')
	.option('-d, --dev', 'Development mode, including verbose logging', false)
	.option('-l, --log', 'Log subprocess output to console', false)
	.option('-c, --config <value>', 'Specify a config file', 'config.json')
	.parse(process.argv);


setupConfig();

setupWinston();

var env = program.dev ? 'development' : (process.env.NODE_ENV || 'production');
process.env.NODE_ENV = env;
global.env = env;


// running commands
program
	.command('start')
	.description('Start the SkyBB server')
	.action(function () {
		require('../lib/running').start(program);
	});
program
	.command('slog', null, {
		noHelp: true,
	})
	.description('Start the SkyBB server and view the live output log')
	.action(function () {
		program.log = true;
		require('../lib/running').start(program);
	});
program
	.command('dev', null, {
		noHelp: true,
	})
	.description('Start SkyBB in verbose development mode')
	.action(function () {
		program.dev = true;
		process.env.NODE_ENV = 'development';
		global.env = 'development';
		require('../lib/running').start(program);
	});
program
	.command('stop')
	.description('Stop the SkyBB server')
	.action(function () {
		require('../lib/running').stop(program);
	});
program
	.command('restart')
	.description('Restart the SkyBB server')
	.action(function () {
		require('../lib/running').restart(program);
	});
program
	.command('status')
	.description('Check the running status of the SkyBB server')
	.action(function () {
		require('../lib/running').status(program);
	});
program
	.command('log')
	.description('Open the output log (useful for debugging)')
	.action(function () {
		require('../lib/running').log(program);
	});

// management commands
program
	.command('setup [config]')
	.description('Run the SkyBB setup script, or setup with an initial config')
	.action(function (initConfig) {
		if (initConfig) {
			try {
				initConfig = JSON.parse(initConfig);
			} catch (e) {
				console.warn('Invalid JSON passed as initial config value.'.red);
				console.log('If you meant to pass in an initial config value, please try again.\n');

				throw e;
			}
		}
		console.log("initConfig:");
		console.dir(initConfig);
		require('../lib/setup').setup(initConfig);
	});

program
	.command('install')
	.description('Launch the SkyBB web installer for configuration setup')
	.action(function () {
		require('../lib/setup').webInstall();
	});
program
	.command('build [targets...]')
	.description('Compile static assets ' + '(JS, CSS, templates, languages, sounds)'.red)
	.option('-s, --series', 'Run builds in series without extra processes')
	.action(function (targets, options) {
		require('../lib/manage').build(targets.length ? targets : true, options);
	})
	.on('--help', function () {
		require('../lib/manage').buildTargets();
	});
program
	.command('activate [plugin]')
	.description('Activate a plugin for the next startup of SkyBB (nodebb-plugin- prefix is optional)')
	.action(function (plugin) {
		require('../lib/manage').activate(plugin);
	});
program
	.command('plugins')
	.action(function () {
		require('../lib/manage').listPlugins();
	})
	.description('List all installed plugins');
program
	.command('events')
	.description('Outputs the last ten (10) administrative events recorded by SkyBB')
	.action(function () {
		require('../lib/manage').listEvents();
	});
program
	.command('info')
	.description('Outputs various system info')
	.action(function () {
		require('../lib/manage').info();
	});

// reset
var resetCommand = program.command('reset');

resetCommand
	.description('Reset plugins, themes, settings, etc')
	.option('-t, --theme [theme]', 'Reset to [theme] or to the default theme')
	.option('-p, --plugin [plugin]', 'Disable [plugin] or all plugins')
	.option('-w, --widgets', 'Disable all widgets')
	.option('-s, --settings', 'Reset settings to their default values')
	.option('-a, --all', 'All of the above')
	.action(function (options) {
		var valid = ['theme', 'plugin', 'widgets', 'settings', 'all'].some(function (x) {
			return options[x];
		});
		if (!valid) {
			console.warn('\n  No valid options passed in, so nothing was reset.'.red);
			resetCommand.help();
		}

		require('../lib/reset').reset(options, function (err) {
			if (err) { throw err; }
			require('../lib/meta/build').buildAll(function (err) {
				if (err) { throw err; }

				process.exit();
			});
		});
	});

// upgrades
program
	.command('upgrade [scripts...]')
	.description('Run SkyBB upgrade scripts and ensure packages are up-to-date, or run a particular upgrade script')
	.option('-m, --package', 'Update package.json from defaults', false)
	.option('-i, --install', 'Bringing base dependencies up to date', false)
	.option('-p, --plugins', 'Check installed plugins for updates', false)
	.option('-s, --schema', 'Update SkyBB data store schema', false)
	.option('-b, --build', 'Rebuild assets', false)
	.on('--help', function () {
		console.log('\n' + [
			'When running particular upgrade scripts, options are ignored.',
			'By default all options are enabled. Passing any options disables that default.',
			'Only package and dependency updates: ' + 'snode upgrade -mi'.yellow,
			'Only database update: ' + 'snode upgrade -s'.yellow,
		].join('\n'));
	})
	.action(function (scripts, options) {
		require('../lib/upgrade').upgrade(scripts.length ? scripts : true, options);
	});

program
	.command('upgrade-plugins', null, {
		noHelp: true,
	})
	.alias('upgradePlugins')
	.description('Upgrade plugins')
	.action(function () {
		require('../lib/upgrade-plugins').upgradePlugins(function (err) {
			if (err) {
				throw err;
			}
			console.log('OK'.green);
			process.exit();
		});
	});

program
	.command('help [command]')
	.description('Display help for [command]')
	.action(function (name) {
		if (!name) {
			return program.help();
		}

		var command = program.commands.find(function (command) { return command._name === name; });
		if (command) {
			command.help();
		} else {
			program.help();
		}
	});

require('../lib/helpers/colors');

if (process.argv.length === 2) {
	program.help();
}

program.executables = false;

program.parse(process.argv);
