define([
	"skylark-jquery",
	"slax-skybb-base/socket",
	'./header'
], function ($,socket,header) {
	'use strict';
	var Consent = {};

	Consent.init = function () {
		header.init();

		$('[data-action="consent"]').on('click', function () {
			socket.emit('user.gdpr.consent', {}, function (err) {
				if (err) {
					return app.alertError(err.message);
				}

				ajaxify.refresh();
			});
		});
	};

	return Consent;
});
