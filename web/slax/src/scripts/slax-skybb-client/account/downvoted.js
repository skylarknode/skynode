define( [
	"skylark-jquery",
	'./header', 
	'./posts'
], function ($,header, posts) {
	'use strict';
	var Downvoted = {};

	Downvoted.init = function () {
		header.init();

		$('[component="post/content"] img:not(.not-responsive)').addClass('img-responsive');

		posts.handleInfiniteScroll('posts.loadMoreDownVotedPosts', 'account/downvoted');
	};

	return Downvoted;
});
