'use strict';
var nfs = require('skynode-nfs');
var async = require('async');
var semver = require('semver');
var winston = require('winston');
var nconf = system.require('skynode-basis/system/parameters');
require('colors');

//var pkg = system.require('skynode-basis/../package.json');
var Dependencies = module.exports;

var depsMissing = false;
var depsOutdated = false;

Dependencies.check = function (callback) {
	console.log("pkg:" + nfs.join(nconf.get('base_dir'),"package.json"));
	var pkg = require(nfs.join(nconf.get('base_dir'),"package.json"));

	var modules = Object.keys(pkg.dependencies);

	winston.verbose('Checking dependencies for outdated modules');

	async.each(modules, Dependencies.checkModule, function (err) {
		if (err) {
			return callback(err);
		}

		if (depsMissing) {
			callback(new Error('dependencies-missing'));
		} else if (depsOutdated) {
			callback(global.env !== 'development' ? new Error('dependencies-out-of-date') : null);
		} else {
			callback(null);
		}
	});
};

var pluginNamePattern = /^(@.*?\/)?(nodebb|skybb)-(theme|plugin|widget|rewards)-.*$/;//modified by lwf

Dependencies.checkModule = function (moduleName, callback) {
	//fs.readFile(nfs.join(__dirname, '../../node_modules/', moduleName, 'package.json'), {
	fs.readFile(nfs.join(nconf.get('base_dir'), 'node_modules/', moduleName, 'package.json'), {
		encoding: 'utf-8',
	}, function (err, pkgData) {
		if (err) {
			// If a bundled plugin/theme is not present, skip the dep check (#3384)
			if (err.code === 'ENOENT' && pluginNamePattern.test(moduleName)) {
				winston.warn('[meta/dependencies] Bundled plugin ' + moduleName + ' not found, skipping dependency check.');
				return callback(null, true);
			}
			return callback(err);
		}

		pkgData = Dependencies.parseModuleData(moduleName, pkgData);
	
		var pkg = require(nfs.join(nconf.get('base_dir'),"package.json"));
		var satisfies = Dependencies.doesSatisfy(pkgData, pkg.dependencies[moduleName]);
		callback(null, satisfies);
	});
};

Dependencies.parseModuleData = function (moduleName, pkgData) {
	try {
		pkgData = JSON.parse(pkgData);
	} catch (e) {
		winston.warn('[' + 'missing'.red + '] ' + moduleName.bold + ' is a required dependency but could not be found\n');
		depsMissing = true;
		return null;
	}
	return pkgData;
};

Dependencies.doesSatisfy = function (moduleData, packageJSONVersion) {
	if (!moduleData) {
		return false;
	}
	var versionOk = !semver.validRange(packageJSONVersion) || semver.satisfies(moduleData.version, packageJSONVersion);
	var githubRepo = moduleData._resolved && moduleData._resolved.includes('//github.com');
	var satisfies = versionOk || githubRepo;
	if (!satisfies) {
		winston.warn('[' + 'outdated'.yellow + '] ' + moduleData.name.bold + ' installed v' + moduleData.version + ', package.json requires ' + packageJSONVersion + '\n');
		depsOutdated = true;
	}
	return satisfies;
};
