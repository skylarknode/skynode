define( [
	"skylark-jquery",
	'./header'
], function ($,header) {
	'use strict';
	var AccountTopics = {};

	AccountTopics.init = function () {
		header.init();

		var groupsEl = $('#groups-list');

		groupsEl.on('click', '.list-cover', function () {
			var groupSlug = $(this).parents('[data-slug]').attr('data-slug');

			ajaxify.go('groups/' + groupSlug);
		});
	};

	return AccountTopics;
});
