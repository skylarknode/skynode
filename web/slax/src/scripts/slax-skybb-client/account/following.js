define( [
	"skylark-jquery",
	'./header'
], function (header) {
	'use strict';
	var	Following = {};

	Following.init = function () {
		header.init();
	};

	return Following;
});
