define([
	"skylark-jquery",
	"slax-skybb-base/socket",
	'./header'
], function ($,socket, header) {
	'use strict';
	var AccountUploads = {};

	AccountUploads.init = function () {
		header.init();

		$('[data-action="delete"]').on('click', function () {
			var el = $(this).parents('[data-name]');
			var name = el.attr('data-name');

			socket.emit('user.deleteUpload', { name: name, uid: ajaxify.data.uid }, function (err) {
				if (err) {
					return app.alertError(err.message);
				}
				el.remove();
			});
			return false;
		});
	};

	return AccountUploads;
});
