define([
	"skylark-jquery",
	'./topicList'
], function (topicList) {
	'use strict';
	var	Recent = {};

	Recent.init = function () {
		app.enterRoom('recent_topics');

		topicList.init('recent');
	};

	return Recent;
});
