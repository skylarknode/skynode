'use strict';

var async = require('async');
///var mkdirp = require('mkdirp');
var nfs = require('skynode-nfs');
var mkdirp = nfs.mkdir;
///var rimraf = require('rimraf');

var plugins = require('skynode-basis/plugins');
var minifier = require('./minifier');

var nconf = require('nconf');


var JS = module.exports;

JS.scripts = {
	// modified by lwf
	base: [
		///'node_modules/promise-polyfill/dist/polyfill.js',
		///'node_modules/socket.io-client/dist/socket.io.js',
		'slax/packages/socket.io.js',
		// /'public/vendor/xregexp/xregexp.js',
		// /'public/vendor/xregexp/unicode/unicode-base.js',

		'slax/packages/require.js',
		'slax/packages/require-config.js',
/*
		'slax/dist/uncompressed/slax-skybb-all.js',
		///'node_modules/skylark-slax-runtime/dist/uncompressed/skylark-slax-runtime-all.js',
		///'node_modules/skylark-domx-i18n/dist/uncompressed/skylark-domx-i18n.js',
		//		'node_modules/skylark-widgets-repeater/dist/uncompressed/skylark-widgets-repeater.js',
		// /		'node_modules/skylark-ui-shells/dist/uncompressed/skylark-ui-shells-all.js',
		// /		'node_modules/skylark-jquery/dist/uncompressed/skylark-jquery.js',
		// 'public/vendor/skylark/skylark-jquery-all.js',
		// 'node_modules/jquery/dist/jquery.js',
		// 'public/vendor/jquery/timeago/jquery.timeago.js',
		///'node_modules/skylark-jquery-timeago/dist/uncompressed/skylark-jquery-timeago.js',
		// /'public/vendor/skylark/skylark-init-timeago.js',
		// 'public/vendor/jquery/js/jquery.form.min.js',
		///'node_modules/skylark-jquery-form/dist/uncompressed/skylark-jquery-form.js',
		// /'public/vendor/skylark/skylark-init-form.js',
		// 'public/vendor/visibility/visibility.min.js',
		// /'public/vendor/skylark/skylark-visibility.js',
		// /'public/vendor/skylark/skylark-init-visibility.js',
		// 'node_modules/bootstrap/dist/js/bootstrap.js',
		// 'public/vendor/jquery/bootstrap-tagsinput/bootstrap-tagsinput.min.js',
		// /'public/vendor/skylark/skylark-bootstrap3.js',
		// /'public/vendor/skylark/skylark-init-bootstrap3.js',

		///'node_modules/skylark-jquery-textcomplete/dist/uncompressed/skylark-jquery-textcomplete.js',
		// /'public/vendor/skylark/skylark-init-textcomplete.js',
		// 'public/vendor/requirejs/require.js',
		// 'public/src/require-config.js',
		// 'public/vendor/bootbox/bootbox.js',
		// /'public/vendor/skylark/skylark-bootbox4.js',
		// /'public/vendor/skylark/skylark-init-bootbox4.js',

		// 'public/vendor/tinycon/tinycon.js',
		// /'public/vendor/skylark/skylark-tinycon.js',
		// /'public/vendor/skylark/skylark-init-tinycon.js',

		// 'node_modules/benchpressjs/build/benchpress.js',
		///'node_modules/skylark-benchpress/dist/uncompressed/skylark-benchpress.js',
		//		'node_modules/skylark-ui-i18n/dist/uncompressed/skylark-ui-i18n.js',
		//'public/src/modules/translator.js',
		'public/src/modules/components.js',
		///'node_modules/skylark-sortable/dist/uncompressed/skylark-sortable.js',
		// /'public/vendor/skylark/skylark-init-sortable.js',
		///'node_modules/skylark-slideout/dist/uncompressed/skylark-slideout.js',
		// /'public/vendor/skylark/skylark-init-slideout.js',

		//'public/vendor/bootbox/wrapper.js',
		//'public/src/utils.js',
		// 'public/src/sockets.js',
		// 'public/src/app.js',
		// 'public/src/ajaxify.js',
		'public/src/app.js',
		// /'public/vendor/skylark/init-app.js',
		'public/src/overrides.js',
		// 'public/src/widgets.js',
*/
	],

	// files listed below are only available client-side, or are bundled in to reduce # of network requests on cold load
	rjs: [
		'slax/dist/scripts/slax-skybb-client.js',
		'slax/packages/client.init.js',

/*
		'public/src/client/footer.js',
		'public/src/client/header/chat.js',
		'public/src/client/header/notifications.js',
		'public/src/client/infinitescroll.js',
		'public/src/client/pagination.js',
		'public/src/client/recent.js',
		'public/src/client/unread.js',
		'public/src/client/topic.js',
		'public/src/client/topic/events.js',
		'public/src/client/topic/posts.js',
		'public/src/client/topic/images.js',
		'public/src/client/topic/votes.js',
		'public/src/client/topic/postTools.js',
		'public/src/client/topic/threadTools.js',
		'public/src/client/categories.js',
		'public/src/client/category.js',
		'public/src/client/category/tools.js',

		//		'public/src/modules/translator.js',
		//		'public/src/modules/components.js',
		'public/src/modules/sort.js',
		'public/src/modules/navigator.js',
		'public/src/modules/topicSelect.js',
		'public/src/modules/topicList.js',
		'public/src/modules/categorySelector.js',
		'public/src/modules/categorySearch.js',
		'public/src/modules/share.js',
		'public/src/modules/alerts.js',
		'public/src/modules/taskbar.js',
		'public/src/modules/helpers.js',
		'public/src/modules/storage.js',
		'public/src/modules/handleBack.js',
*/
	],

	admin: [
		'slax/dist/scripts/slax-skybb-admin.js',
		'slax/packages/admin.init.js',

/*
		//'node_modules/material-design-lite/material.js',
		'slax/node_modules/skylark-jqueryui-interact/dist/uncompressed/skylark-jqueryui-interact.js',
		'slax/node_modules/skylark-jqueryui/dist/uncompressed/skylark-jqueryui.js',
		// 'public/vendor/jquery/sortable/Sortable.js',
		//'public/vendor/colorpicker/colorpicker.js',
		'slax/node_modules/skylark-eyecon-colorpicker/dist/uncompressed/skylark-eyecon-colorpicker.js',
		'public/src/admin/admin.js',
		//'public/vendor/semver/semver.browser.js',
		//'public/vendor/jquery/serializeObject/jquery.ba-serializeobject.min.js',
		//'public/vendor/jquery/deserialize/jquery.deserialize.min.js',
		// 'public/vendor/slideout/slideout.min.js',
		//'public/vendor/nprogress.min.js'
*/
	],

	// modules listed below are built (/src/modules) so they can be defined anonymously
	modules: {
/*
		//'Chart.js': 'node_modules/chart.js/dist/Chart.min.js',
		'skylark-chartjs.js':'slax/node_modules/skylark-chartjs/dist/uncompressed/skylark-chartjs.js',
		//'mousetrap.js': 'node_modules/mousetrap/mousetrap.min.js',
		'skylark-mousetrap.js': 'slax/node_modules/skylark-mousetrap/dist/uncompressed/skylark-mousetrap.js',
		//'cropper.js': 'node_modules/cropperjs/dist/cropper.min.js',
		'skylark-cropperjs.js': 'slax/node_modules/skylark-cropperjs/dist/uncompressed/skylark-cropperjs.js',
		//'jqueryui.js': 'public/vendor/jquery/js/jquery-ui.js',
		//'zxcvbn.js': 'node_modules/zxcvbn/dist/zxcvbn.js',
		'skylark-zxcvbn.js': 'slax/node_modules/skylark-zxcvbn/dist/uncompressed/skylark-zxcvbn.js',
		//ace: 'node_modules/ace-builds/src-min',
		'skylark-ace': 'slax/node_modules/skylark-ace/dist/uncompressed/skylark-ace',
		'skylark-codemirror': 'slax/node_modules/skylark-codemirror/dist/uncompressed/skylark-codemirror',
		//'clipboard.js': 'node_modules/clipboard/dist/clipboard.min.js',
		'skylark-clipboard.js': 'slax/node_modules/skylark-clipboard/dist/uncompressed/skylark-clipboard.js'
*/
	},
};

function linkIfLinux(srcPath, destPath, next) {
	if (process.platform === 'win32') {
		nfs.copyFile(srcPath, destPath, next);
	} else {
		nfs.linkFile(srcPath, destPath, true, next);
	}
}

//var basePath = nfs.resolve(__dirname, '../..');
var basePath = nconf.get('base_dir');

function minifyModules(modules, fork, callback) {
	var moduleDirs = modules.reduce(function (prev, mod) {
		var dir = nfs.resolve(nfs.dirname(mod.destPath));
		if (!prev.includes(dir)) {
			prev.push(dir);
		}
		return prev;
	}, []);

	async.each(moduleDirs, mkdirp, function (err) {
		if (err) {
			return callback(err);
		}

		var filtered = modules.reduce(function (prev, mod) {
			if (mod.srcPath.endsWith('.min.js') || nfs.dirname(mod.srcPath).endsWith('min')) {
				prev.skip.push(mod);
			} else {
				prev.minify.push(mod);
			}

			return prev;
		}, { minify: [], skip: [] });

		async.parallel([
			function (cb) {
				minifier.js.minifyBatch(filtered.minify, fork, cb);
			},
			function (cb) {
				async.each(filtered.skip, function (mod, next) {
					linkIfLinux(mod.srcPath, mod.destPath, next);
				}, cb);
			},
		], callback);
	});
}

function linkModules(callback) {
	var modules = JS.scripts.modules;

	async.each(Object.keys(modules), function (relPath, next) {
		//var srcPath = nfs.join(__dirname, '../../', modules[relPath]);
		var srcPath = nfs.join(nconf.get('base_dir'),  modules[relPath]);
		//var destPath = nfs.join(__dirname, '../../build/public/src/modules', relPath);
		var destPath = nfs.join(nconf.get('base_dir'), 'build/public/src/modules', relPath);

		async.parallel({
			dir: function (cb) {
				mkdirp(nfs.dirname(destPath), function (err) {
					cb(err);
				});
			},
			stats: function (cb) {
				nfs.stat(srcPath, cb);
			},
		}, function (err, res) {
			if (err) {
				return next(err);
			}
			if (res.stats.isDirectory()) {
				console.log("aaaa");
				return nfs.linkDir(srcPath, destPath, true, next);
			}

			linkIfLinux(srcPath, destPath, next);
		});
	}, callback);
}


var moduleDirs = ['modules', 'admin', 'client'];

function getModuleList(callback) {
	var modules = Object.keys(JS.scripts.modules).map(function (relPath) {
		return {
			//srcPath: nfs.join(__dirname, '../../', JS.scripts.modules[relPath]),
			srcPath: nfs.join(nconf.get('base_dir'),  JS.scripts.modules[relPath]),
			//destPath: nfs.join(__dirname, '../../build/public/src/modules', relPath),
			destPath: nfs.join(nconf.get('base_dir'), 'build/public/src/modules', relPath),
		};
	});

	//var coreDirs = moduleDirs.map(function (dir) {
	//	return {
	//		srcPath: nfs.join(__dirname, '../../public/src', dir),
	//		destPath: nfs.join(__dirname, '../../build/public/src', dir),
	//	};
	//});

	//modules = modules.concat(coreDirs); // modified by lwf

	var moduleFiles = [];
	async.each(modules, function (module, next) {
		var srcPath = module.srcPath;
		var destPath = module.destPath;

		nfs.stat(srcPath, function (err, stats) {
			if (err) {
				return next(err);
			}
			if (!stats.isDirectory()) {
				moduleFiles.push(module);
				return next();
			}

			nfs.walk(srcPath, function (err, files) {
				if (err) {
					return next(err);
				}

				var mods = files.filter(function (filePath) {
					return nfs.extname(filePath) === '.js';
				}).map(function (filePath) {
					return {
						srcPath: nfs.normalize(filePath),
						destPath: nfs.join(destPath, nfs.relative(srcPath, filePath)),
					};
				});

				moduleFiles = moduleFiles.concat(mods).map(function (mod) {
					mod.filename = nfs.relative(basePath, mod.srcPath).replace(/\\/g, '/');
					return mod;
				});

				next();
			});
		});
	}, function (err) {
		callback(err, moduleFiles);
	});
}

function clearModules(callback) {
	var builtPaths = moduleDirs.map(function (p) {
		//return nfs.join(__dirname, '../../build/public/src', p);
		return nfs.join(nconf.get('base_dir'), 'build/public/src', p);
	});
	async.each(builtPaths, function (builtPath, next) {
		nfs.rimraf(builtPath,  next);
	}, function (err) {
		callback(err);
	});
}

JS.buildModules = function (fork, callback) {
	async.waterfall([
		clearModules,
		function (next) {
			if (global.env === 'development') {
				return linkModules(callback);
			}

			getModuleList(next);
		},
		function (modules, next) {
			minifyModules(modules, fork, next);
		},
	], callback);
};

JS.linkStatics = function (callback) {
	//rimraf(nfs.join(__dirname, '../../build/public/plugins'), function (err) {
	nfs.rimraf(nfs.join(nconf.get('base_dir'), 'build/public/plugins'), function (err) {
		if (err) {
			return callback(err);
		}
		async.each(Object.keys(plugins.staticDirs), function (mappedPath, next) {
			var sourceDir = plugins.staticDirs[mappedPath];
			//var destDir = nfs.join(__dirname, '../../build/public/plugins', mappedPath);
			var destDir = nfs.join(nconf.get('base_dir'), 'build/public/plugins', mappedPath);

			mkdirp(nfs.dirname(destDir), function (err) {
				if (err) {
					return next(err);
				}

				nfs.linkDir(sourceDir, destDir, true, next);
			});
		}, callback);
	});
};

function getBundleScriptList(target, callback) {
	var pluginDirectories = [];

	if (target === 'admin') {
		target = 'acp';
	}
	var pluginScripts = plugins[target + 'Scripts'].filter(function (path) {
		if (path.endsWith('.js')) {
			return true;
		}

		pluginDirectories.push(path);
		return false;
	});

	async.each(pluginDirectories, function (directory, next) {
		nfs.walk(directory, function (err, scripts) {
			if (err) {
				return next(err);
			}

			pluginScripts = pluginScripts.concat(scripts);
			next();
		});
	}, function (err) {
		if (err) {
			return callback(err);
		}

		var scripts = JS.scripts.base;

//		if (target === 'client' && global.env !== 'development') {
		if (target === 'client') {
			scripts = scripts.concat(JS.scripts.rjs);
		} else if (target === 'acp') {
			scripts = scripts.concat(JS.scripts.admin);
		}

		scripts = scripts.concat(pluginScripts).map(function (script) {
			var srcPath = nfs.resolve(basePath, script).replace(/\\/g, '/');
			return {
				srcPath: srcPath,
				filename: nfs.relative(basePath, srcPath).replace(/\\/g, '/'),
			};
		});

		callback(null, scripts);
	});
}

JS.buildBundle = function (target, fork, callback) {
	var fileNames = {
		client: 'client.min.js',
		admin: 'acp.min.js',
	};

	async.waterfall([
		function (next) {
			getBundleScriptList(target, next);
		},
		function (files, next) {
			//mkdirp(nfs.join(__dirname, '../../build/public'), function (err) {
			mkdirp(nfs.join(nconf.get('base_dir'), 'build/public'), function (err) {
				next(err, files);
			});
		},
		function (files, next) {
			var minify = global.env !== 'development';
			//var filePath = nfs.join(__dirname, '../../build/public', fileNames[target]);
			var filePath = nfs.join(nconf.get('base_dir'), 'build/public', fileNames[target]);

			minifier.js.bundle({
				files: files,
				filename: fileNames[target],
				destPath: filePath,
			}, minify, fork, next);
		},
	], callback);
};

JS.killMinifier = function () {
	minifier.killAll();
};