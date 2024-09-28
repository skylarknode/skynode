define( [
	"skylark-jquery",
	'../settings'
], function ($,Settings) {
	'use strict';
	var Languages = {};

	Languages.init = function () {
		Settings.prepare();
	};

	return Languages;
});
