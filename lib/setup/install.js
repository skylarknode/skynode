'use strict';
//original : NodeBB-1.11.2/src/install.js
var async = require('async');
var fs = require('fs');
var url = require('url');
var path = require('path');
var prompt = require('prompt');
var winston = require('winston');
var nconf = system.require('skynode-basis/system/parameters');
var _ = require('lodash');

var utils = system.require('skynode-basis/utils');

var install = module.exports;
var questions = {};

questions.main = [
	{
		name: 'url',
		description: 'URL used to access this SkyBB',
		default:
			nconf.get('url') || 'http://localhost:4567',
		pattern: /^http(?:s)?:\/\//,
		message: 'Base URL must begin with \'http://\' or \'https://\'',
	},
	{
		name: 'secret',
		description: 'Please enter a SkyBB secret',
		default: nconf.get('secret') || utils.generateUUID(),
	},
	{
		name: 'database',
		description: 'Which database to use',
		default: nconf.get('database') || 'mongo',
	},
];

questions.optional = [
	{
		name: 'port',
		default: nconf.get('port') || 4567,
	},
];

function checkSetupFlag(next) {
	var setupVal = install.values;

	try {
		if (nconf.get('setup')) {
			setupVal = JSON.parse(nconf.get('setup'));
		}
	} catch (err) {}

	if (setupVal && typeof setupVal === 'object') {
		if (setupVal['admin:username'] && setupVal['admin:password'] && setupVal['admin:password:confirm'] && setupVal['admin:email']) {
			install.values = setupVal;
			next();
		} else {
			winston.error('Required values are missing for automated setup:');
			if (!setupVal['admin:username']) {
				winston.error('  admin:username');
			}
			if (!setupVal['admin:password']) {
				winston.error('  admin:password');
			}
			if (!setupVal['admin:password:confirm']) {
				winston.error('  admin:password:confirm');
			}
			if (!setupVal['admin:email']) {
				winston.error('  admin:email');
			}

			process.exit();
		}
	} else if (nconf.get('database')) {
		install.values = install.values || {};
		install.values.database = nconf.get('database');
		next();
	} else {
		next();
	}
}

function checkCIFlag(next) {
	var ciVals;
	try {
		ciVals = JSON.parse(nconf.get('ci'));
	} catch (e) {
		ciVals = undefined;
	}

	if (ciVals && ciVals instanceof Object) {
		if (ciVals.hasOwnProperty('host') && ciVals.hasOwnProperty('port') && ciVals.hasOwnProperty('database')) {
			install.ciVals = ciVals;
			next();
		} else {
			winston.error('Required values are missing for automated CI integration:');
			if (!ciVals.hasOwnProperty('host')) {
				winston.error('  host');
			}
			if (!ciVals.hasOwnProperty('port')) {
				winston.error('  port');
			}
			if (!ciVals.hasOwnProperty('database')) {
				winston.error('  database');
			}

			process.exit();
		}
	} else {
		next();
	}
}

function setupConfig(next) {
	var configureDatabases = require('./web/databases');

	// prompt prepends "prompt: " to questions, let's clear that.
	prompt.start();
	prompt.message = '';
	prompt.delimiter = '';
	prompt.colors = false;

	async.waterfall([
		function (next) {
			if (install.values) {
				// Use provided values, fall back to defaults
				var config = {};
				var redisQuestions = require('skynode-kvs/redis').questions;
				var mongoQuestions = require('skynode-kvs/mongo').questions;
				var postgresQuestions = require('skynode-kvs/postgres').questions;
				var allQuestions = questions.main.concat(questions.optional).concat(redisQuestions).concat(mongoQuestions).concat(postgresQuestions);

				allQuestions.forEach(function (question) {
					config[question.name] = install.values[question.name] || question.default || undefined;
				});
				setImmediate(next, null, config);
			} else {
				prompt.get(questions.main, next);
			}
		},
		function (config, next) {
			configureDatabases(config, next);
		},
		function (config, next) {
			completeConfigSetup(config, next);
		},
	], next);
}

function completeConfigSetup(config, next) {
	// Add CI object
	if (install.ciVals) {
		config.test_database = {};
		for (var prop in install.ciVals) {
			if (install.ciVals.hasOwnProperty(prop)) {
				config.test_database[prop] = install.ciVals[prop];
			}
		}
	}

	// Add package_manager object if set
	if (nconf.get('package_manager')) {
		config.package_manager = nconf.get('package_manager');
	}
   
   console.log("overrides_config:");
   console.dir(config);

	nconf.overrides(config);
	async.waterfall([
		function (next) {
			system.require('skynode-basis/database').init(next);
		},
		function (next) {
			system.require('skynode-basis/database').createIndices(next);
		},
		function (next) {
			// Sanity-check/fix url/port
			if (!/^http(?:s)?:\/\//.test(config.url)) {
				config.url = 'http://' + config.url;
			}
			var urlObj = url.parse(config.url);
			if (urlObj.port) {
				config.port = urlObj.port;
			}

			// Remove trailing slash from non-subfolder installs
			if (urlObj.path === '/') {
				urlObj.path = '';
				urlObj.pathname = '';
			}

			config.url = url.format(urlObj);

			// ref: https://github.com/indexzero/nconf/issues/300
			delete config.type;

			install.save(config, next);
		},
	], next);
}

function setupDefaultConfigs(next) {
	console.log('Populating database with default configs, if not already set...');
	var meta = require('../meta');
	///var defaults = require(path.join(__dirname, '../meta/', 'install/data/defaults.json'));
	var defaults = require('../meta/install/data/defaults.json');

	meta.configs.setOnEmpty(defaults, function (err) {
		if (err) {
			return next(err);
		}

		meta.configs.init(next);
	});
}

function enableDefaultTheme(next) {
	var meta = require('../meta');

	meta.configs.get('theme:id', function (err, id) {
		if (err || id) {
			console.log('Previous theme detected, skipping enabling default theme');
			return next(err);
		}
		var defaultTheme = nconf.get('defaultTheme') || 'skybb-theme-ucms';
		console.log('Enabling default theme: ' + defaultTheme);
		meta.themes.set({
			type: 'local',
			id: defaultTheme,
		}, next);
	});
}

function createAdministrator(next) {
	console.log("createAdministrator");
	var Groups = require('../../snode/groups');
	Groups.getMemberCount('administrators', function (err, memberCount) {
		if (err) {
			return next(err);
		}
		if (memberCount >100) {
			console.log('Administrator found, skipping Admin setup');
			next();
		} else {
			createAdmin(next);
		}
	});
}

function createAdmin(callback) {
	var User = require('../../snode/user');
	var Groups = require('../../snode/groups');
	var password;
	var meta = require('../meta');

	winston.warn('No administrators have been detected, running initial user setup\n');

	var questions = [{
		name: 'username',
		description: 'Administrator username',
		required: true,
		type: 'string',
	}, {
		name: 'email',
		description: 'Administrator email address',
		pattern: /.+@.+/,
		required: true,
	}];
	var passwordQuestions = [{
		name: 'password',
		description: 'Password',
		required: true,
		hidden: true,
		type: 'string',
	}, {
		name: 'password:confirm',
		description: 'Confirm Password',
		required: true,
		hidden: true,
		type: 'string',
	}];
	function success(err, results) {
		if (err) {
			return callback(err);
		}
		if (!results) {
			return callback(new Error('aborted'));
		}

		if (results['password:confirm'] !== results.password) {
			winston.warn('Passwords did not match, please try again');
			return retryPassword(results);
		}

		if (results.password.length < meta.config.minimumPasswordLength) {
			winston.warn('Password too short, please try again');
			return retryPassword(results);
		}

		var adminUid;
		async.waterfall([
			function (next) {
				User.create({ username: results.username, password: results.password, email: results.email }, next);
			},
			function (uid, next) {
				adminUid = uid;
				Groups.join('administrators', uid, next);
			},
			function (next) {
				Groups.show('administrators', next);
			},
			function (next) {
				Groups.ownership.grant(adminUid, 'administrators', next);
			},
		], function (err) {
			if (err) {
				return callback(err);
			}
			callback(null, password ? results : undefined);
		});
	}
	function retryPassword(originalResults) {
		// Ask only the password questions
		prompt.get(passwordQuestions, function (err, results) {
			if (!results) {
				return callback(new Error('aborted'));
			}

			// Update the original data with newly collected password
			originalResults.password = results.password;
			originalResults['password:confirm'] = results['password:confirm'];

			// Send back to success to handle
			success(err, originalResults);
		});
	}

	// Add the password questions
	questions = questions.concat(passwordQuestions);

	if (!install.values) {
		prompt.get(questions, success);
	} else {
		// If automated setup did not provide a user password, generate one, it will be shown to the user upon setup completion
		if (!install.values.hasOwnProperty('admin:password') && !nconf.get('admin:password')) {
			console.log('Password was not provided during automated setup, generating one...');
			password = utils.generateUUID().slice(0, 8);
		}

		var results = {
			username: install.values['admin:username'] || nconf.get('admin:username') || 'admin',
			email: install.values['admin:email'] || nconf.get('admin:email') || '',
			password: install.values['admin:password'] || nconf.get('admin:password') || password,
			'password:confirm': install.values['admin:password:confirm'] || nconf.get('admin:password') || password,
		};

		success(null, results);
	}
}

function createGlobalModeratorsGroup(next) {
	var groups = require('../../snode/groups');
	async.waterfall([
		function (next) {
			groups.exists('Global Moderators', next);
		},
		function (exists, next) {
			if (exists) {
				winston.info('Global Moderators group found, skipping creation!');
				return next(null, null);
			}
			groups.create({
				name: 'Global Moderators',
				userTitle: 'Global Moderator',
				description: 'Forum wide moderators',
				hidden: 0,
				private: 1,
				disableJoinRequests: 1,
			}, next);
		},
		function (groupData, next) {
			groups.show('Global Moderators', next);
		},
	], next);
}

function giveGlobalPrivileges(next) {
	var privileges = require('../../snode/privileges');
	var defaultPrivileges = [
		'chat', 'upload:post:image', 'signature', 'search:content',
		'search:users', 'search:tags', 'local:login',
	];
	privileges.global.give(defaultPrivileges, 'registered-users', next);
}

function createCategories(next) {
	var Categories = require('../../snode/categories');
	var db = require('skynode-kvs');
	db.getSortedSetRange('categories:cid', 0, -1, function (err, cids) {
		if (err) {
			return next(err);
		}

		if (Array.isArray(cids) && cids.length) {
			console.log('Categories OK. Found ' + cids.length + ' categories.');
			return next();
		}

		console.log('No categories found, populating instance with default categories');

		fs.readFile(path.join(__dirname, '../../node_modules/../meta/', 'install/data/categories.json'), 'utf8', function (err, default_categories) {
			if (err) {
				return next(err);
			}
			default_categories = JSON.parse(default_categories);

			async.eachSeries(default_categories, Categories.create, next);
		});
	});
}

function createMenuItems(next) {
	var db = require('skynode-kvs');

	db.exists('navigation:enabled', function (err, exists) {
		if (err || exists) {
			return next(err);
		}
		var navigation = require('../../snode/navigation/admin');
		var data = require('../meta/install/data/navigation.json');

		navigation.save(data, next);
	});
}

function createWelcomePost(next) {
	var db = require('skynode-kvs');
	var Topics = require('../../snode/topics');

	async.parallel([
		function (next) {
			fs.readFile(path.join(__dirname, '../../node_modules/../meta/', 'install/data/welcome.md'), 'utf8', next);
		},
		function (next) {
			db.getObjectField('global', 'topicCount', next);
		},
	], function (err, results) {
		if (err) {
			return next(err);
		}

		var content = results[0];
		var numTopics = results[1];

		if (!parseInt(numTopics, 10)) {
			console.log('Creating welcome post!');
			Topics.post({
				uid: 1,
				cid: 2,
				title: 'Welcome to your SkyBB!',
				content: content,
			}, next);
		} else {
			next();
		}
	});
}

function enableDefaultPlugins(next) {
	console.log('Enabling default plugins');

	var defaultEnabled = [
		'nodebb-plugin-custom-homepage',
		'nodebb-plugin-dbsearch',
		'nodebb-plugin-google-adsense',
		'nodebb-plugin-google-analytics',
		'nodebb-plugin-mentions',
		'nodebb-plugin-soundpack-default',
		'nodebb-plugin-spam-be-gone',
		'nodebb-plugin-sso-github',
		'nodebb-plugin-sso-google',
		'nodebb-plugin-sso-jwt',
		'nodebb-plugin-superusers',
		'nodebb-plugin-teamspeak',
		'nodebb-rewards-essentials',
		'nodebb-widget-teamspeak',
		'skybb-plugin-composer-oneposter',
		'skybb-widget-ucms'
	];
	var customDefaults = nconf.get('defaultplugins') || nconf.get('defaultPlugins');

	winston.info('[install/defaultPlugins] customDefaults', customDefaults);

	if (customDefaults && customDefaults.length) {
		try {
			customDefaults = Array.isArray(customDefaults) ? customDefaults : JSON.parse(customDefaults);
			defaultEnabled = defaultEnabled.concat(customDefaults);
		} catch (e) {
			// Invalid value received
			winston.info('[install/enableDefaultPlugins] Invalid defaultPlugins value received. Ignoring.');
		}
	}

	defaultEnabled = _.uniq(defaultEnabled);

	winston.info('[install/enableDefaultPlugins] activating default plugins', defaultEnabled);

	var db = require('skynode-kvs');
	var order = defaultEnabled.map(function (plugin, index) {
		return index;
	});
	db.sortedSetAdd('plugins:active', order, defaultEnabled, next);
}

function setCopyrightWidget(next) {
	var db = require('skynode-kvs');
	async.parallel({
		footerJSON: function (next) {
			fs.readFile(path.join(__dirname, '../../node_modules/../meta', 'install/data/footer.json'), 'utf8', next);
		},
		footer: function (next) {
			db.getObjectField('widgets:global', 'footer', next);
		},
	}, function (err, results) {
		if (err) {
			return next(err);
		}

		if (!results.footer && results.footerJSON) {
			db.setObjectField('widgets:global', 'footer', results.footerJSON, next);
		} else {
			next();
		}
	});
}

install.setup = function (callback) {
	async.series([
		checkSetupFlag,
		checkCIFlag,
		setupConfig,
		setupDefaultConfigs,
		enableDefaultTheme,
		createCategories,
		createAdministrator,
		createGlobalModeratorsGroup,
		giveGlobalPrivileges,
		createMenuItems,
		createWelcomePost,
		enableDefaultPlugins,
		setCopyrightWidget,
/*
		function (next) {
			var upgrade = require('./upgrade');
			upgrade.check(function (err) {
				if (err && err.message === 'schema-out-of-date') {
					upgrade.run(next);
				} else if (err) {
					return next(err);
				} else {
					next();
				}
			});
		},
*/
	], function (err, results) {
		if (err) {
			winston.warn('SkyBB Setup Aborted.\n ' + err.stack);
			process.exit(1);
		} else {
			var data = {};
			if (results[6]) {
				data.username = results[6].username;
				data.password = results[6].password;
			}

			callback(null, data);
		}
	});
};

install.save = function (server_conf, callback) {
	var serverConfigPath = path.join(__dirname, '../config.json');

	if (nconf.get('config')) {
		serverConfigPath = path.resolve(__dirname, '../', nconf.get('config'));
	}

	fs.writeFile(serverConfigPath, JSON.stringify(server_conf, null, 4), function (err) {
		if (err) {
			winston.error('Error saving server configuration!', err);
			return callback(err);
		}

		console.log('Configuration Saved OK');

		nconf.file({
			file: serverConfigPath,
		});

		callback();
	});
};
