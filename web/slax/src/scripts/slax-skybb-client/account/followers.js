define([
	"skylark-jquery",
	'./header'
], function ($,header) {
	'use strict';
	var	Followers = {};

	Followers.init = function () {
		header.init();
	};

	return Followers;
});
