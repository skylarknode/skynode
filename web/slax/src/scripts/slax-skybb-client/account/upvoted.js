define([
	"skylark-jquery",
	'./header', 
	'./posts'
], function ($,header, posts) {
	'use strict';
	var Upvoted = {};

	Upvoted.init = function () {
		header.init();

		$('[component="post/content"] img:not(.not-responsive)').addClass('img-responsive');

		posts.handleInfiniteScroll('posts.loadMoreUpVotedPosts', 'account/upvoted');
	};

	return Upvoted;
});
