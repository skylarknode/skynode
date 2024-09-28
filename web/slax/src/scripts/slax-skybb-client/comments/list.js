define([
	"skylark-jquery",
	"slax-skybb-base/utils",
	'slax-skybb-base/misc/components',
	'slax-skybb-base/misc/infinitescroll',
	'slax-skybb-base/misc/pagination',
	'slax-skybb-base/misc/navigator',
	'./tools',
	'./images'
], function (
	$,
	utils, 
	components, 
	infinitescroll,
	pagination, 
	navigator, 
	commentTools, 
	images
) {
	'use strict';

	var CommentList = { };

	CommentList.modifyCommentsByPrivileges = function (comments) {
		comments.forEach(function (comment) {
			comment.selfComment = !!app.user.uid && parseInt(comment.uid, 10) === parseInt(app.user.uid, 10);
			comment.display_edit_tools = (ajaxify.data.privileges['comments:edit'] && comment.selfComment) || ajaxify.data.privileges.isAdminOrMod;
			comment.display_delete_tools = (ajaxify.data.privileges['comments:delete'] && comment.selfComment) || ajaxify.data.privileges.isAdminOrMod;
			comment.display_moderator_tools = comment.display_edit_tools || comment.display_delete_tools;
			comment.display_move_tools = ajaxify.data.privileges.isAdminOrMod;
			comment.display_comment_menu = ajaxify.data.privileges.isAdminOrMod || (comment.selfComment && !ajaxify.data.locked) || ((app.user.uid || ajaxify.data.commentSharing.length) && !comment.deleted);
		});
	};

	function updateCommentCounts(comments) {
		for (var i = 0; i < comments.length; i += 1) {
			var cmp = components.get('user/commentcount', comments[i].uid);
			cmp.html(parseInt(cmp.attr('data-commentcount'), 10) + 1);
			utils.addCommasToNumbers(cmp);
		}
	}

	CommentList.onNewCommentPagination =  function onNewCommentPagination(data) {
		function scrollToComment() {
			scrollToCommentIfSelf(data.comments[0]);
		}

		var comments = data.comments;

		ajaxify.data.pagination.pageCount = Math.max(1, Math.ceil(comments[0].post.commentcount / config.commentsPerPage));
		var direction = config.postCommentSort === 'oldest_to_newest' || config.postCommentSort === 'most_votes' ? 1 : -1;

		var isCommentVisible = (ajaxify.data.pagination.currentPage === ajaxify.data.pagination.pageCount && direction === 1) ||
							(ajaxify.data.pagination.currentPage === 1 && direction === -1);

		if (isCommentVisible) {
			createNewComments(data, components.get('comment').not('[data-index=0]'), direction, scrollToComment);
		} else if (ajaxify.data.scrollToMyComment && parseInt(comments[0].uid, 10) === parseInt(app.user.uid, 10)) {
			// https://github.com/SkyBB/SkyBB/issues/5004#issuecomment-247157441
			setTimeout(function () {
				pagination.loadPage(ajaxify.data.pagination.pageCount, scrollToComment);
			}, 250);
		} else {
			updatePagination();
		}
	}

	function updatePagination() {
		///$.get(config.relative_path + '/api/post/pagination/' + ajaxify.data.pid, { page: ajaxify.data.pagination.currentPage }, function (paginationData) {
		$.get(app.apiBaseUrl + '/api/post/pagination/' + ajaxify.data.pid, { page: ajaxify.data.pagination.currentPage }, function (paginationData) {
			app.parseAndTranslate('partials/paginator', { pagination: paginationData }, function (html) {
				$('[component="pagination"]').after(html).remove();
			});
		});
	}

	CommentList.onNewCommentInfiniteScroll =  function onNewCommentInfiniteScroll(data) {
		var direction = config.postCommentSort === 'oldest_to_newest' || config.postCommentSort === 'most_votes' ? 1 : -1;

		var isPreviousCommentAdded = $('[component="comment"][data-index="' + (data.comments[0].index - 1) + '"]').length;
		if (!isPreviousCommentAdded && (!data.comments[0].selfComment || !ajaxify.data.scrollToMyComment)) {
			return;
		}

		if (!isPreviousCommentAdded && data.comments[0].selfComment) {
			return ajaxify.go('comment/' + data.comments[0].mid);
		}

		createNewComments(data, components.get('comment').not('[data-index=0]'), direction, function (html) {
			if (html) {
				html.addClass('new');
			}
			scrollToCommentIfSelf(data.comments[0]);
		});
	}

	function scrollToCommentIfSelf(comment) {
		if (comment.selfComment && ajaxify.data.scrollToMyComment) {
			navigator.scrollBottom(comment.index);
		}
	}

	function createNewComments(data, repliesSelector, direction, callback) {
		callback = callback || function () {};
		if (!data || (data.comments && !data.comments.length)) {
			return callback();
		}

		function removeAlreadyAddedComments() {
			var newComments = $('[component="comment"].new');

			if (newComments.length === data.comments.length) {
				var allSamePids = true;
				newComments.each(function (index, el) {
					if (parseInt($(el).attr('data-mid'), 10) !== parseInt(data.comments[index].mid, 10)) {
						allSamePids = false;
					}
				});

				if (allSamePids) {
					newComments.each(function () {
						$(this).removeClass('new');
					});
					data.comments.length = 0;
					return;
				}
			}

			if (newComments.length && data.comments.length > 1) {
				data.comments.forEach(function (comment) {
					var p = components.get('comment', 'mid', comment.mid);
					if (p.hasClass('new')) {
						p.remove();
					}
				});
			}

			data.comments = data.comments.filter(function (comment) {
				return $('[component="comment"][data-mid="' + comment.mid + '"]').length === 0;
			});
		}

		removeAlreadyAddedComments();

		if (!data.comments.length) {
			return callback();
		}

		var after;
		var before;

		if (direction > 0 && repliesSelector.length) {
			after = repliesSelector.last();
		} else if (direction < 0 && repliesSelector.length) {
			before = repliesSelector.first();
		}

		data.slug = ajaxify.data.slug;

		$(window).trigger('action:comments.loading', { comments: data.comments, after: after, before: before });

		app.parseAndTranslate('partials/comments/list', 'items', data, function (html) {
			html = html.filter(function () {
				var mid = $(this).attr('data-mid');
				return mid && $('[component="comment"][data-mid="' + mid + '"]').length === 0;
			});

			if (after) {
				html.insertAfter(after);
			} else if (before) {
				// Save document height and position for future reference (about 5 lines down)
				var height = $(document).height();
				var scrollTop = $(window).scrollTop();

				html.insertBefore(before);

				// Now restore the relative position the user was on prior to new comment insertion
				$(window).scrollTop(scrollTop + ($(document).height() - height));
			} else {
				components.get('post').append(html);
			}

			infinitescroll.removeExtra($('[component="comment"]'), direction, config.commentsPerPage * 2);

			$(window).trigger('action:comments.loaded', { comments: data.comments });

			CommentList.onNewCommentsAddedToDom(html);

			callback(html);
		});
	}

	CommentList.loadMoreComments = function (direction) {
		if (!components.get('post').length || navigator.scrollActive || CommentList._infiniteScrollTimeout) {
			return;
		}

		CommentList._infiniteScrollTimeout = setTimeout(function () {
			delete CommentList._infiniteScrollTimeout;
		}, 1000);
		var replies = components.get('post').find(components.get('comment').not('[data-index=0]').not('.new'));
		var afterEl = direction > 0 ? replies.last() : replies.first();
		var after = parseInt(afterEl.attr('data-index'), 10) || 0;

		var pid = ajaxify.data.pid;
		if (!utils.isNumber(pid) || !utils.isNumber(after) || (direction < 0 && components.get('comment', 'index', 0).length)) {
			return;
		}

		var indicatorEl = $('.loading-indicator');
		if (!indicatorEl.is(':animated')) {
			indicatorEl.fadeIn();
		}

		infinitescroll.loadMore('posts.loadMore', {
			pid: pid,
			after: after,
			count: config.commentsPerPage,
			direction: direction,
			postCommentSort: config.postCommentSort,
		}, function (data, done) {
			indicatorEl.fadeOut();

			if (data && data.comments && data.comments.length) {
				createNewComments(data, replies, direction, done);
			} else {
				navigator.update();
				done();
			}
		});
	};

	CommentList.onPostPageLoad = function (comments) {
		images.wrapImagesInLinks(comments);
		CommentList.showBottomCommentBar();
		comments.find('[component="comment/content"] img:not(.not-responsive)').addClass('img-responsive');
		addBlockquoteEllipses(comments.find('[component="comment/content"] > blockquote > blockquote'));
		hideCommentToolsForDeletedComments(comments);
	};

	CommentList.onNewCommentsAddedToDom = function (comments) {
		CommentList.onPostPageLoad(comments);

		app.createUserTooltips(comments);

		utils.addCommasToNumbers(comments.find('.formatted-number'));
		utils.makeNumbersHumanReadable(comments.find('.human-readable-number'));
		comments.find('.timeago').timeago();
	};

	CommentList.showBottomCommentBar = function () {
		var mainComment = components.get('comment', 'index', 0);
		var placeHolder = $('.comment-bar-placeholder');
		var comments = $('[component="comment"]');
		if (!!mainComment.length && comments.length > 1 && $('.comment-bar').length < 2 && placeHolder.length) {
			$('.comment-bar').clone().insertAfter(placeHolder);
			placeHolder.remove();
		} else if (mainComment.length && comments.length < 2) {
			mainComment.find('.comment-bar').remove();
		}
	};

	function hideCommentToolsForDeletedComments(comments) {
		comments.each(function () {
			if ($(this).hasClass('deleted')) {
				commentTools.toggle($(this).attr('data-mid'), true);
			}
		});
	}

	function addBlockquoteEllipses(blockquotes) {
		blockquotes.each(function () {
			var $this = $(this);
			if ($this.find(':hidden:not(br)').length && !$this.find('.toggle').length) {
				$this.append('<i class="fa fa-angle-down pointer toggle"></i>');
			}
		});
	}

	return CommentList;
});
