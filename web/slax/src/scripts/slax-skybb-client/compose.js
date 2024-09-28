define([
	"skylark-jquery"
], function ($) {
	'use strict';
	var Compose = {};

	Compose.init = function () {
		var container = $('.composer');

		if (container.length) {
			$(window).trigger('action:composer.enhance', {
				container: container,
			});
		}
	};

	return Compose;
});
