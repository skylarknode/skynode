'use strict';

var winston = require('winston');
var nconf = system.require('skynode-basis/system/parameters');
var nfs = require('skynode-nfs');

var async = require('async');
//var rimraf = require('rimraf');

var plugins = system.require('skynode-basis/plugins');
var db = system.require('skynode-basis/database');
var minifier = require('./minifier');

var CSS = module.exports;

CSS.supportedSkins = [
	'cerulean', 'cyborg', 'flatly', 'journal', 'lumen', 'paper', 'simplex',
	'spacelab', 'united', 'cosmo', 'darkly', 'readable', 'sandstone',
	'slate', 'superhero', 'yeti',
];

var buildImports = {
	client: function (source) {
		return '@import "./theme";\n' + source + '\n' + [
			//'@import "font-awesome";',
			///'@import  "../slax/node_modules/skylark-ajaxify-shells/skins/bs3/fontawesome/less/font-awesome.less";',
			//'@import (inline) "../public/vendor/jquery/css/smoothness/jquery-ui.css";',
			///'@import (inline) "../slax/node_modules/skylark-jqueryui/themes/bs3/jquery-ui-1.10.3.custom.css";',
			///'@import (inline) "../slax/node_modules/skylark-ajaxify-shells/skins/bs3/bootstrap-taginput/bootstrap-taginput.css";',
			//'@import (inline) "../public/vendor/colorpicker/colorpicker.css";',
			///'@import (inline) "../slax/node_modules/skylark-cropperjs/skins/default/cropper.css";',
			///'@import (inline) "../slax/node_modules/skylark-codemirror/skins/default/codemirror.css";',
			///'@import (inline) "../slax/node_modules/skylark-domx-panels/skins/default/toolbar.css";',
			///'@import (inline) "../slax/node_modules/skylark-widgets-wordpad/skins/default/wordpad.css";',
			///'@import (inline) "../slax/node_modules/skylark-widgets-wordpad/skins/default/emoji.css";',
			///'@import "../slax/src/skins/less/flags.less";',
			///'@import "../slax/src/skins/less/admin/manage/ip-blacklist.less";',
			///'@import "../slax/src/skins/less/generics.less";',
			///'@import "../slax/src/skins/less/mixins.less";',
			///'@import "../slax/src/skins/less/global.less";',
		].map(function (str) {
			return str.replace(/\//g, nfs.sep);
		}).join('\n');
	},
	admin: function (source) {
		return source + '\n' + [
			//'@import "font-awesome";',
			'@import  "skylark-appify-shells/skins/bs3/fontawesome/less/font-awesome.less";',
			'@import "skybb-slax/admin/admin";',
			'@import "skybb-slax/generics.less";',
			//'@import (inline) "../public/vendor/colorpicker/colorpicker.css";',
			'@import (inline) "skylark-jqueryui/themes/bs3/jquery-ui-1.10.3.custom.css";',
			'@import (inline) "skylark-appify-shells/skins/bs3/bootstrap-taginput/bootstrap-taginput.css";',
			//			'@import (inline) "../node_modules/skylark-widgets-shells/skins/materialize/material.css";',
			'@import (inline) "skylark-appify-shells/skins/bs3/bootstrap-material-design/bootstrap-material-design.css";',
			'@import (inline) "skylark-eyecon-colorpicker/skins/default/colorpicker.css";',
//			'@import (inline) "../slax/node_modules/skylark-widgets-shells/skins/bs3/bootstrap-material-design/ripples.css";',
		].map(function (str) {
			return str.replace(/\//g, nfs.sep);
		}).join('\n');
	},
};

function filterMissingFiles(filepaths, callback) {
	async.filter(filepaths, function (filepath, next) {
		//nfs.exists(nfs.join(__dirname, '../../node_modules', filepath), function (err, exists) {
		nfs.exists(nfs.join(nconf.get('base_dir'), 'node_modules', filepath), function (err, exists) {
			if (!exists) {
				winston.warn('[meta/css] File not found! ' + filepath);
			}

			next(err, exists);
		});
	}, callback);
}

function getImports(files, prefix, extension, callback) {
	var pluginDirectories = [];
	var source = '';

	files.forEach(function (styleFile) {
		if (styleFile.endsWith(extension)) {
			source += prefix + nfs.sep + styleFile + '";';
		} else {
			pluginDirectories.push(styleFile);
		}
	});

	async.each(pluginDirectories, function (directory, next) {
		nfs.walk(directory, function (err, styleFiles) {
			if (err) {
				return next(err);
			}

			styleFiles.forEach(function (styleFile) {
				source += prefix + nfs.sep + styleFile + '";';
			});

			next();
		});
	}, function (err) {
		callback(err, source);
	});
}

function getBundleMetadata(target, callback) {
	var paths = [
		//nfs.join(__dirname, '../../slax/node_modules'),
		//nfs.join(__dirname, '../../node_modules'),
		//nfs.join(__dirname, '../../slax/src/skins/less'),
		nfs.join(nconf.get('base_dir'), 'slax/node_modules'),
		nfs.join(nconf.get('base_dir'), 'node_modules'),
		nfs.join(nconf.get('base_dir'), 'slax/src/styles/less'),
//		nfs.join(__dirname, '../../slax/node_modules/skylark-ajaxify-shells/skins/bs3/fontawesome/less'),
	];

	// Skin support
	let skin;
	if (target.startsWith('client-')) {
		skin = target.split('-')[1];

		if (CSS.supportedSkins.includes(skin)) {
			target = 'client';
		}
	}

	async.waterfall([
		function (next) {
			if (target !== 'client') {
				return next(null, null);
			}

			db.getObjectFields('config', ['theme:type', 'theme:id', 'bootswatchSkin'], next);
		},
		function (themeData, next) {
			if (target === 'client') {
				var themeId = (themeData['theme:id'] || 'nodebb-theme-persona');
				var baseThemePath = nfs.join(nconf.get('themes_path'), (themeData['theme:type'] && themeData['theme:type'] === 'local' ? themeId : 'nodebb-theme-vanilla'));
				paths.unshift(baseThemePath);

				themeData.bootswatchSkin = skin || themeData.bootswatchSkin;
			}

			async.parallel({
				less: function (cb) {
					async.waterfall([
						function (next) {
							filterMissingFiles(plugins.lessFiles, next);
						},
						function (lessFiles, next) {
							getImports(lessFiles, '\n@import ".', '.less', next);
						},
					], cb);
				},
				acpLess: function (cb) {
					if (target === 'client') {
						return cb(null, '');
					}

					async.waterfall([
						function (next) {
							filterMissingFiles(plugins.acpLessFiles, next);
						},
						function (acpLessFiles, next) {
							getImports(acpLessFiles, '\n@import ".', '.less', next);
						},
					], cb);
				},
				css: function (cb) {
					async.waterfall([
						function (next) {
							filterMissingFiles(plugins.cssFiles, next);
						},
						function (cssFiles, next) {
							getImports(cssFiles, '\n@import (inline) ".', '.css', next);
						},
					], cb);
				},
				skin: function (cb) {
					const skinImport = [];
					if (themeData && themeData.bootswatchSkin) {
						skinImport.push('\n@import "./bootswatch/' + themeData.bootswatchSkin + '/variables.less";');
						skinImport.push('\n@import "./bootswatch/' + themeData.bootswatchSkin + '/bootswatch.less";');
					}

					cb(null, skinImport.join(''));
				},
			}, next);
		},
		function (result, next) {
			var skinImport = result.skin;
			var cssImports = result.css;
			var lessImports = result.less;
			var acpLessImports = result.acpLess;

			var imports = skinImport + '\n' + cssImports + '\n' + lessImports + '\n' + acpLessImports;
			imports = buildImports[target](imports);

			next(null, { paths: paths, imports: imports });
		},
	], callback);
}

CSS.buildBundle = function (target, fork, callback) {
	async.waterfall([
		function (next) {
			if (target === 'client') {
				//rimraf(nfs.join(__dirname, '../../build/public/client*'), next);
				nfs.rimraf(nfs.join(nconf.get('base_dir'), nconf.get("system:build:styles:output"),'./client*'), next);
			} else {
				setImmediate(next);
			}
		},
		function (next) {
			getBundleMetadata(target, next);
		},
		function (data, next) {
			var minify = global.env !== 'development';
			minifier.css.bundle(data.imports, data.paths, minify, fork, next);
		},
		function (bundle, next) {
			var filename = target + '.css';

			//nfs.writeFile(nfs.join(__dirname, '../../build/public', filename), bundle.code, function (err) {
			nfs.writeFile(nfs.join(nconf.get('base_dir'), nconf.get("system:build:styles:output"), filename), bundle.code, function (err) {
				next(err, bundle.code);
			});
		},
	], callback);
};
