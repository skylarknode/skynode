define([
	"skylark-jquery",
	'./topicList'
], function ($,topicList) {
	'use strict';
	var	Top = {};

	Top.init = function () {
		app.enterRoom('top_topics');

		topicList.init('top');
	};

	return Top;
});
