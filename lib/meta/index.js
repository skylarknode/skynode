'use strict';

var async = require('async');
var winston = require('winston');
var os = require('os');
var nconf = system.require('skynode-basis/system/parameters');

var pubsub = system.require('skynode-basis/pubsub');
var utils = system.require('skynode-basis/utils');

var Meta = module.exports;

Meta.reloadRequired = false;

Meta.configs = system.require('skynode-basis/meta/configs');
Meta.themes = system.require('skynode-basis/meta/themes');
Meta.js = require('./js');
Meta.css = require('./css');
Meta.sounds = require('./sounds');
Meta.settings = system.require('skynode-basis/meta/settings');
Meta.logs = system.require('skynode-basis/meta/logs');
Meta.errors = system.require('skynode-basis/meta/errors');
Meta.tags = system.require('skynode-basis/meta/tags');
Meta.dependencies = require('./dependencies');
Meta.templates = require('./templates');
Meta.blacklist = system.require('skynode-basis/meta/blacklist');
Meta.languages = require('./languages');

/* Assorted */

if (nconf.get('isPrimary') === 'true') {
	pubsub.on('meta:restart', function (data) {
		if (data.hostname !== os.hostname()) {
			restart();
		}
	});
}

Meta.restart = function () {
	pubsub.publish('meta:restart', { hostname: os.hostname() });
	restart();
};

function restart() {
	if (process.send) {
		process.send({
			action: 'restart',
		});
	} else {
		winston.error('[meta.restart] Could not restart, are you sure SkyBB was started with `./skybb start`?');//modified by lwf
	}
}

Meta.getSessionTTLSeconds = function () {
	var ttlDays = 60 * 60 * 24 * Meta.config.loginDays;
	var ttlSeconds = Meta.config.loginSeconds;
	var ttl = ttlSeconds || ttlDays || 1209600; // Default to 14 days
	return ttl;
};

Meta.async = system.require('skynode-basis/promisify')(Meta);
