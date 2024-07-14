'use strict';

var async = require('async');
///var mkdirp = require('mkdirp');
var nfs = require('skynode-nfs');
var mkdirp = nfs.mkdir;
///var rimraf = require('rimraf');

var plugins = system.require('skynode-basis/plugins');
var minifier = require('./minifier');

var nconf = system.require('skynode-basis/system/parameters');


var JS = module.exports;

const bundles = nconf.get("system:build:scripts:bundles");


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
	///var modules = JS.scripts.modules;
	var modules = bundles.base.modules;

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
	///var modules = Object.keys(JS.scripts.modules).map(function (relPath) {
	var modules = Object.keys(bundles.base.modules).map(function (relPath) {
		return {
			//srcPath: nfs.join(__dirname, '../../', JS.scripts.modules[relPath]),
			srcPath: nfs.join(nconf.get('base_dir'),  bundles.base.modules[relPath]),
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
	nfs.rimraf(nfs.join(nconf.get('base_dir'), 'slax/dist/extras/plugins'), function (err) {
		if (err) {
			return callback(err);
		}
		async.each(Object.keys(plugins.staticDirs), function (mappedPath, next) {
			var sourceDir = plugins.staticDirs[mappedPath];
			//var destDir = nfs.join(__dirname, '../../build/public/plugins', mappedPath);
			var destDir = nfs.join(nconf.get('base_dir'), 'slax/dist/extras/plugins', mappedPath);

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

	var targetForPlugin = target;
	if (targetForPlugin === 'admin') {
		targetForPlugin = 'acp';
	}
	var pluginScripts = plugins[targetForPlugin + 'Scripts'].filter(function (path) {
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

		///var scripts = JS.scripts.base;
		var scripts = bundles.base.includes;

//		if (target === 'client' && global.env !== 'development') {
///		if (target === 'client') {
///			scripts = scripts.concat(JS.scripts.rjs);
///		} else if (target === 'acp') {
///			scripts = scripts.concat(JS.scripts.admin);
///		}
		scripts = scripts.concat(bundles[target].includes);

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
	///var fileNames = {
	///	client: 'client.min.js',
	///	admin: 'acp.min.js',
	///};

	async.waterfall([
		function (next) {
			getBundleScriptList(target, next);
		},
		function (files, next) {
			//mkdirp(nfs.join(__dirname, '../../build/public'), function (err) {
			mkdirp(nfs.join(nconf.get('base_dir'), bundles[target].output.dir), function (err) {
				next(err, files);
			});
		},
		function (files, next) {
			var minify = global.env !== 'development';
			//var filePath = nfs.join(__dirname, '../../build/public', fileNames[target]);
			var filePath = nfs.join(nconf.get('base_dir'), bundles[target].output.dir, bundles[target].output.file);

			minifier.js.bundle({
				files: files,
				filename: bundles[target].output.file,
				destPath: filePath,
			}, minify, fork, next);
		},
	], callback);
};

JS.killMinifier = function () {
	minifier.killAll();
};
