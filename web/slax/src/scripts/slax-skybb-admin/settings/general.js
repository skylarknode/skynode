'use strict';


define([
	"skylark-jquery"
], function ($) {
	var Module = {};

	Module.init = function () {
		$('button[data-action="removeLogo"]').on('click', function () {
			$('input[data-field="brand:logo"]').val('');
		});
		$('button[data-action="removeFavicon"]').on('click', function () {
			$('input[data-field="brand:favicon"]').val('');
		});
		$('button[data-action="removeTouchIcon"]').on('click', function () {
			$('input[data-field="brand:touchIcon"]').val('');
		});
		$('button[data-action="removeOgImage"]').on('click', function () {
			$('input[data-field="removeOgImage"]').val('');
		});
	};

	return Module;
});
