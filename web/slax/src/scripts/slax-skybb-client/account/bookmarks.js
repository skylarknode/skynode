define( [
	"skylark-jquery",
	'./header', 
	'./posts'
], function ($,header, posts) {
	'use strict';
	var Bookmarks = {};

	Bookmarks.init = function () {
		header.init();

		$('[component="post/content"] img:not(.not-responsive)').addClass('img-responsive');

		posts.handleInfiniteScroll('posts.loadMoreBookmarks', 'account/bookmarks');
	};

	return Bookmarks;
});
