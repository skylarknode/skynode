define([
	"skylark-jquery",
	'slax-skybb-base/misc/navigator', 
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components', 
	'./list'
], function ($,navigator, socket, components, CommentList) {
	'use strict';
	
	var CommentReplies = {};

	CommentReplies.init = function (button) {
		var comment = button.closest('[data-mid]');
		var mid = comment.data('mid');
		var open = button.find('[component="comment/replies/open"]');
		var loading = button.find('[component="comment/replies/loading"]');
		var close = button.find('[component="comment/replies/close"]');

		if (open.is(':not(.hidden)') && loading.is('.hidden')) {
			open.addClass('hidden');
			loading.removeClass('hidden');

			socket.emit('comments.getReplies', mid, function (err, data) {
				loading.addClass('hidden');
				if (err) {
					open.removeClass('hidden');
					return app.alertError(err.message);
				}

				close.removeClass('hidden');

				CommentList.modifyCommentsByPrivileges(data);
				var tplData = {
					comments: data,
					privileges: ajaxify.data.privileges,
					'downvote:disabled': ajaxify.data['downvote:disabled'],
					'reputation:disabled': ajaxify.data['reputation:disabled'],
					loggedIn: !!app.user.uid,
					hideReplies: true,
				};
				app.parseAndTranslate('post', 'comments', tplData, function (html) {
					$('<div>', { component: 'comment/replies' }).html(html).hide().insertAfter(button)
						.slideDown('fast');
					CommentList.onNewCommentsAddedToDom(html);
					$(window).trigger('action:comments.loaded', { comments: data });
				});
			});
		} else if (close.is(':not(.hidden)')) {
			close.addClass('hidden');
			open.removeClass('hidden');
			loading.addClass('hidden');
			comment.find('[component="comment/replies"]').slideUp('fast', function () {
				$(this).remove();
			});
		}
	};

	CommentReplies.onNewComment = function (data) {
		var comment = data.comments[0];
		if (!comment) {
			return;
		}
		incrementCount(comment, 1);
		data.hideReplies = true;
		app.parseAndTranslate('partials/comments/list',"items", data, function (html) {
			var replies = $('[component="comment"][data-mid="' + comment.mid + '"] [component="comment/replies"]').first();
			if (replies.length) {
				replies.append(html);
				CommentList.onNewCommentsAddedToDom(html);
			}
		});
	};

	CommentReplies.onCommentPurged = function (comment) {
		incrementCount(comment, -1);
	};

	function incrementCount(comment, inc) {
		var replyCount = $('[component="comment"][data-mid="' + comment.mid + '"]').find('[component="comment/reply-count"]').first();
		var countEl = replyCount.find('[component="comment/reply-count/text"]');
		var avatars = replyCount.find('[component="comment/reply-count/avatars"]');
		var count = Math.max(0, parseInt(countEl.attr('data-replies'), 10) + inc);
		var timestamp = replyCount.find('.timeago').attr('title', comment.timestampISO);

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

	CommentList.onNewComment = function (data) {
		if (!data || !data.comments || !data.comments.length || parseInt(data.comments[0].pid, 10) !== parseInt(ajaxify.data.pid, 10)) {
			return;
		}

		data.loggedIn = !!app.user.uid;
		data.privileges = ajaxify.data.privileges;

		// prevent timeago in future by setting timestamp to 1 sec behind now
		data.comments[0].timestamp = Date.now() - 1000;
		data.comments[0].timestampISO = utils.toISOString(data.comments[0].timestamp);

		CommentList.modifyCommentsByPrivileges(data.comments);

		updateCommentCounts(data.comments);

		ajaxify.data.commentcount += 1;
		commentTools.updateCommentCount(ajaxify.data.commentcount);

		if (config.usePagination) {
			CommentList.onNewCommentPagination(data);
		} else {
			CommentList.onNewCommentInfiniteScroll(data);
		}

		//require(['forum/post/replies'], function (replies) {
			replies.onNewComment(data);
		//});
	};

	return CommentReplies;
});
