define([
	"skylark-jquery",
	'./header', 
	'./topics'
], function (header, topics) {
	'use strict';
	var AccountWatched = {};

	AccountWatched.init = function () {
		header.init();

		topics.handleInfiniteScroll('account/watched', 'uid:' + ajaxify.data.theirid + ':followed_tids');
	};

	return AccountWatched;
});
