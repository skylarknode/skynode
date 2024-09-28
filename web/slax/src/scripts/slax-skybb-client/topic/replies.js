define([
	"skylark-jquery",
	"slax-skybb-base/utils",
	'slax-skybb-base/misc/navigator', 
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components', 
	'./posts'
], function ($,utils,navigator, socket, components, posts) {
	'use strict';
	
	var Replies = {};

	function updatePostCounts(posts) {
		for (var i = 0; i < posts.length; i += 1) {
			var cmp = components.get('user/postcount', posts[i].uid);
			cmp.html(parseInt(cmp.attr('data-postcount'), 10) + 1);
			utils.addCommasToNumbers(cmp);
		}
	}


	Replies.init = function (button) {
		var post = button.closest('[data-pid]');
		var pid = post.data('pid');
		var open = button.find('[component="post/replies/open"]');
		var loading = button.find('[component="post/replies/loading"]');
		var close = button.find('[component="post/replies/close"]');

		if (open.is(':not(.hidden)') && loading.is('.hidden')) {
			open.addClass('hidden');
			loading.removeClass('hidden');

			socket.emit('posts.getReplies', pid, function (err, data) {
				loading.addClass('hidden');
				if (err) {
					open.removeClass('hidden');
					return app.alertError(err.message);
				}

				close.removeClass('hidden');

				posts.modifyPostsByPrivileges(data);
				var tplData = {
					posts: data,
					privileges: ajaxify.data.privileges,
					'downvote:disabled': ajaxify.data['downvote:disabled'],
					'reputation:disabled': ajaxify.data['reputation:disabled'],
					loggedIn: !!app.user.uid,
					hideReplies: true,
				};
				app.parseAndTranslate('topic', 'posts', tplData, function (html) {
					$('<div>', { component: 'post/replies' }).html(html).hide().insertAfter(button)
						.slideDown('fast');
					posts.onNewPostsAddedToDom(html);
					$(window).trigger('action:posts.loaded', { posts: data });
				});
			});
		} else if (close.is(':not(.hidden)')) {
			close.addClass('hidden');
			open.removeClass('hidden');
			loading.addClass('hidden');
			post.find('[component="post/replies"]').slideUp('fast', function () {
				$(this).remove();
			});
		}
	};

	Replies.onNewPost = function (data) {
		var post = data.posts[0];
		if (!post) {
			return;
		}
		incrementCount(post, 1);
		data.hideReplies = true;
		app.parseAndTranslate('topic', 'posts', data, function (html) {
			var replies = $('[component="post"][data-pid="' + post.toPid + '"] [component="post/replies"]').first();
			if (replies.length) {
				replies.append(html);
				posts.onNewPostsAddedToDom(html);
			}
		});
	};

	Replies.onPostPurged = function (post) {
		incrementCount(post, -1);
	};

	function incrementCount(post, inc) {
		var replyCount = $('[component="post"][data-pid="' + post.toPid + '"]').find('[component="post/reply-count"]').first();
		var countEl = replyCount.find('[component="post/reply-count/text"]');
		var avatars = replyCount.find('[component="post/reply-count/avatars"]');
		var count = Math.max(0, parseInt(countEl.attr('data-replies'), 10) + inc);
		var timestamp = replyCount.find('.timeago').attr('title', post.timestampISO);

		countEl.attr('data-replies', count);
		replyCount.toggleClass('hidden', count <= 0);
		if (count > 1) {
			countEl.translateText('[[topic:replies_to_this_post, ' + count + ']]');
		} else {
			countEl.translateText('[[topic:one_reply_to_this_post]]');
		}

		if (!avatars.find('[data-uid="' + post.uid + '"]').length && count < 7) {
			app.parseAndTranslate('topic', 'posts', { posts: [{ replies: { users: [post.user] } }] }, function (html) {
				avatars.prepend(html.find('[component="post/reply-count/avatars"] [component="user/picture"]'));
			});
		}

		avatars.addClass('hasMore');

		timestamp.data('timeago', null).timeago();
	}

	posts.onNewPost = function (data) {
		if (!data || !data.posts || !data.posts.length || parseInt(data.posts[0].tid, 10) !== parseInt(ajaxify.data.tid, 10)) {
			return;
		}

		data.loggedIn = !!app.user.uid;
		data.privileges = ajaxify.data.privileges;

		// prevent timeago in future by setting timestamp to 1 sec behind now
		data.posts[0].timestamp = Date.now() - 1000;
		data.posts[0].timestampISO = utils.toISOString(data.posts[0].timestamp);

		posts.modifyPostsByPrivileges(data.posts);

		updatePostCounts(data.posts);

		ajaxify.data.postcount += 1;
		postTools.updatePostCount(ajaxify.data.postcount);

		if (config.usePagination) {
			posts.onNewPostPagination(data);
		} else {
			posts.onNewPostInfiniteScroll(data);
		}

		//require(['forum/topic/replies'], function (replies) {
			replies.onNewPost(data);
		//});
	};

	return Replies;
});
