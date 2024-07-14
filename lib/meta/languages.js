'use strict';

var async = require('async');
///var mkdirp = require('mkdirp');
var nfs = require('skynode-nfs');
var mkdirp = nfs.mkdir;

///var rimraf = require('rimraf');
var _ = require('lodash');

var Plugins = system.require('skynode-basis/plugins');

var nconf = system.require('skynode-basis/system/parameters');
//var buildLanguagesPath = nfs.join(__dirname, '../../build/public/language');
var buildLanguagesPath = nfs.join(nconf.get('base_dir'), nconf.get("system:build:languages:output"));
//var coreLanguagesPath = nfs.join(__dirname, '../../slax/src/languages');
///var coreLanguagesPath = nfs.join(nconf.get('base_dir'), 'slax/src/languages');

function getTranslationMetadata(callback) {
	async.waterfall([
		// generate list of languages and namespaces
		/*
		function (next) {
			nfs.walk(coreLanguagesPath, next);
		},
		function (paths, next) {
			var languages = [];
			var namespaces = [];

			paths.forEach(function (p) {
				if (!p.endsWith('.json')) {
					return;
				}

				var rel = nfs.relative(coreLanguagesPath, p).split(/[/\\]/);
				var language = rel.shift().replace('_', '-').replace('@', '-x-');
				var namespace = rel.join('/').replace(/\.json$/, '');

				if (!language || !namespace) {
					return;
				}

				languages.push(language);
				namespaces.push(namespace);
			});
			
			next(null, {
				languages: _.union(languages, Plugins.languageData.languages).sort().filter(Boolean),
				namespaces: _.union(namespaces, Plugins.languageData.namespaces).sort().filter(Boolean),
			});
		},
		*/
		function (next) {
			next(null, {
				languages: _.union(Plugins.languageData.languages).sort().filter(Boolean),
				namespaces: _.union(Plugins.languageData.namespaces).sort().filter(Boolean),
			});
		},

		// save a list of languages to `${buildLanguagesPath}/metadata.json`
		// avoids readdirs later on
		function (ref, next) {
			async.series([
				function (next) {
					mkdirp(buildLanguagesPath, next);
				},
				function (next) {
					nfs.writeFile(nfs.join(buildLanguagesPath, 'metadata.json'), JSON.stringify({
						languages: ref.languages,
						namespaces: ref.namespaces,
					}), next);
				},
			], function (err) {
				next(err, ref);
			});
		},
	], callback);
}

function writeLanguageFile(language, namespace, translations, callback) {
	var dev = global.env === 'development';
	var filePath = nfs.join(buildLanguagesPath, language, namespace + '.json');

	async.series([
		async.apply(mkdirp, nfs.dirname(filePath)),
		async.apply(nfs.writeFile, filePath, JSON.stringify(translations, null, dev ? 2 : 0)),
	], callback);
}

// for each language and namespace combination,
// run through core and all plugins to generate
// a full translation hash
function buildTranslations(ref, next) {
	var namespaces = ref.namespaces;
	var languages = ref.languages;
	var plugins = _.values(Plugins.pluginsData).filter(function (plugin) {
		return typeof plugin.languages === 'string';
	});

	async.each(namespaces, function (namespace, next) {
		async.each(languages, function (lang, next) {
			var translations = {};

			async.series([
				// core first
				function (cb) {
					// for each plugin, fallback in this order:
					//  1. correct language string (en-GB)
					//  2. old language string (en_GB)
					//  3. corrected plugin defaultLang (en-US)
					//  4. old plugin defaultLang (en_US)
					async.each(plugins, function (pluginData, done) {
						///var pluginLanguages = nfs.join(__dirname, '../../node_modules/', pluginData.id, pluginData.languages);
						var pluginLanguages = nfs.join(nconf.get('base_dir'), 'node_modules', pluginData.id, pluginData.languages);
						var defaultLang = pluginData.defaultLang || 'en-GB';

						async.eachSeries([
							defaultLang.replace('-', '_').replace('-x-', '@'),
							defaultLang.replace('_', '-').replace('@', '-x-'),
							lang.replace('-', '_').replace('-x-', '@'),
							lang,
						], function (language, next) {
							nfs.readFile(nfs.join(pluginLanguages, language, namespace + '.json'), 'utf8', function (err, file) {
								if (err) {
									if (err.code === 'ENOENT') {
										return next(null, false);
									}
									return next(err);
								}

								try {
									Object.assign(translations, JSON.parse(file));
									next(null, true);
								} catch (err) {
									next(err);
								}
							});
						}, done);
					}, function (err) {
						if (err) {
							return cb(err);
						}

						if (Object.keys(translations).length) {
							writeLanguageFile(lang, namespace, translations, cb);
							return;
						}
						cb();
					});
				},
			], next);
		}, next);
	}, next);
}

exports.build = function buildLanguages(callback) {
	async.waterfall([
		///function (next) {
		///	nfs.rimraf(buildLanguagesPath, next);
		///},
		getTranslationMetadata,
		buildTranslations,
	], callback);
};
