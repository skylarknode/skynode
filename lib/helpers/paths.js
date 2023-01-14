'use strict';

var nfs = require('skynode-nfs');

var baseDir = nfs.resolve(process.cwd(),process.env["snode_application_root"] || "");//nfs.join(__dirname, '../../');
console.log("baseDir=" + baseDir);
var binDir = nfs.join(__dirname,"../../bin");
var loader = nfs.join(binDir, '../lib/running/loader.js');
var app = nfs.join(binDir, '../lib/running/app.js');
var pidfile = nfs.join(baseDir, 'pidfile');
var config = nfs.join(baseDir, 'web.json');
var serve = nfs.join(binDir, '../lib/running/serve.js');

module.exports = {
	baseDir: baseDir,
	loader: loader,
	app: app,
	pidfile: pidfile,
	config: config,
	serve : serve
};
