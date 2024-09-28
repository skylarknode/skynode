define([
	"skylark-jquery",
	'./topicList'
], function (topicList) {
	'use strict';
	var Popular = {};

	Popular.init = function () {
		app.enterRoom('popular_topics');

		topicList.init('popular');
	};

	return Popular;
});
