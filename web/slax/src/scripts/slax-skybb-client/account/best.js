define([
	"skylark-jquery",
	'./header', 
	'./posts'
], function ($,header, posts) {
	'use strict';
	var Best = {};

	Best.init = function () {
		header.init();

		$('[component="post/content"] img:not(.not-responsive)').addClass('img-responsive');

		posts.handleInfiniteScroll('posts.loadMoreBestPosts', 'account/best');
	};

	return Best;
});
