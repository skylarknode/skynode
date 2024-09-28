define([
	"skylark-jquery",
	"slax-skybb-base/socket",
	"slax-skybb-base/utils",
	'slax-skybb-base/misc/share',
	'slax-skybb-base/misc/components',
	"slax-skybb-base/misc/translator",
	"slax-skybb-base/misc/flags",
	'slax-skybb-base/misc/navigator',
	'./votes'
], function (
	$, 
	socket,
	utils,
	share, 
	components, 
	translator, 
	flags,
	navigator, 
	votes
) {
	'use strict';
	var CommentTools = {};

	var staleReplyAnyway = false;

	CommentTools.init = function (pid) {
		staleReplyAnyway = false;

		renderMenu();

		addCommentHandlers(pid);

		share.addShareHandlers(ajaxify.data.titleRaw);

		votes.addVoteHandler();

		CommentTools.updateCommentCount(ajaxify.data.commentcount);
	};

	function renderMenu() {
		$('[component="post"]').on('show.bs.dropdown', '.moderator-tools', function () {
			var $this = $(this);
			var dropdownMenu = $this.find('.dropdown-menu');
			if (dropdownMenu.html()) {
				return;
			}
			var commentEl = $this.parents('[data-mid]');
			var mid = commentEl.attr('data-mid');
			var index = parseInt(commentEl.attr('data-index'), 10);

			socket.emit('comments.loadCommentTools', { mid: mid, cid: ajaxify.data.cid }, function (err, data) {
				if (err) {
					return app.alertError(err.message);
				}
				data.comments.display_move_tools = data.comments.display_move_tools && index !== 0;

				app.parseAndTranslate('partials/post/comment-menu-list', data, function (html) {
					dropdownMenu.html(html);
					//require(['clipboard'], function (clipboard) { // modified by lwf
					//	new clipboard('[data-clipboard-text]');
					//});
					$(window).trigger('action:comment.tools.load');
				});
			});
		});
	}

	CommentTools.toggle = function (mid, isDeleted) {
		var commentEl = components.get('comment', 'mid', mid);

		commentEl.find('[component="comment/quote"], [component="comment/bookmark"], [component="comment/reply"], [component="comment/flag"], [component="user/chat"]')
			.toggleClass('hidden', isDeleted);

		commentEl.find('[component="comment/delete"]').toggleClass('hidden', isDeleted).parent().attr('hidden', isDeleted ? '' : null);
		commentEl.find('[component="comment/restore"]').toggleClass('hidden', !isDeleted).parent().attr('hidden', !isDeleted ? '' : null);
		commentEl.find('[component="comment/purge"]').toggleClass('hidden', !isDeleted).parent().attr('hidden', !isDeleted ? '' : null);

		CommentTools.removeMenu(commentEl);
	};

	CommentTools.removeMenu = function (commentEl) {
		commentEl.find('[component="comment/tools"] .dropdown-menu').html('');
	};

	CommentTools.updateCommentCount = function (commentCount) {
		var commentCountEl = components.get('post/comment-count');
		commentCountEl.html(commentCount).attr('title', commentCount);
		utils.makeNumbersHumanReadable(commentCountEl);
		navigator.setCount(commentCount);
	};

	function addCommentHandlers(pid) {
		var commentContainer = components.get('post');

		commentContainer.on('click', '[component="comment/quote"]', function () {
			onQuoteClicked($(this), pid);
		});

		commentContainer.on('click', '[component="comment/reply"]', function () {
			onReplyClicked($(this), pid);
		});

		$('.post').on('click', '[component="post/reply"]', function (e) {
			e.preventDefault();
			onReplyClicked($(this), pid);
		});

		commentContainer.on('click', '[component="comment/bookmark"]', function () {
			return bookmarkComment($(this), getData($(this), 'data-mid'));
		});

		commentContainer.on('click', '[component="comment/upvote"]', function () {
			return votes.toggleVote($(this), '.upvoted', 'comments.upvote');
		});

		commentContainer.on('click', '[component="comment/downvote"]', function () {
			return votes.toggleVote($(this), '.downvoted', 'comments.downvote');
		});

		commentContainer.on('click', '[component="comment/vote-count"]', function () {
			votes.showVotes(getData($(this), 'data-mid'));
		});

		commentContainer.on('click', '[component="comment/flag"]', function () {
			var mid = getData($(this), 'data-mid');
			//require(['flags'], function (flags) {
				flags.showFlagModal({
					type: 'comment',
					id: mid,
				});
			//});
		});

		commentContainer.on('click', '[component="comment/edit"]', function () {
			var btn = $(this);

			var timestamp = parseInt(getData(btn, 'data-timestamp'), 10);
			var commentEditDuration = parseInt(ajaxify.data.commentEditDuration, 10);

			if (checkDuration(commentEditDuration, timestamp, 'comment-edit-duration-expired')) {
				$(window).trigger('action:comment.edit', {
					mid: getData(btn, 'data-mid'),
				});
			}
		});

		if (config.enableCommentHistory && ajaxify.data.privileges['comments:history']) {
			commentContainer.on('click', '[component="comment/view-history"], [component="comment/edit-indicator"]', function () {
				var btn = $(this);
				//require(['forum/post/diffs'], function (diffs) {
					diffs.open(getData(btn, 'data-mid'));
				//});
			});
		}

		commentContainer.on('click', '[component="comment/delete"]', function () {
			var btn = $(this);
			var timestamp = parseInt(getData(btn, 'data-timestamp'), 10);
			var commentDeleteDuration = parseInt(ajaxify.data.commentDeleteDuration, 10);
			if (checkDuration(commentDeleteDuration, timestamp, 'comment-delete-duration-expired')) {
				toggleCommentDelete($(this), pid);
			}
		});

		function checkDuration(duration, commentTimestamp, languageKey) {
			if (!ajaxify.data.privileges.isAdminOrMod && duration && Date.now() - commentTimestamp > duration * 1000) {
				var numDays = Math.floor(duration / 86400);
				var numHours = Math.floor((duration % 86400) / 3600);
				var numMinutes = Math.floor(((duration % 86400) % 3600) / 60);
				var numSeconds = ((duration % 86400) % 3600) % 60;
				var msg = '[[error:' + languageKey + ', ' + duration + ']]';
				if (numDays) {
					if (numHours) {
						msg = '[[error:' + languageKey + '-days-hours, ' + numDays + ', ' + numHours + ']]';
					} else {
						msg = '[[error:' + languageKey + '-days, ' + numDays + ']]';
					}
				} else if (numHours) {
					if (numMinutes) {
						msg = '[[error:' + languageKey + '-hours-minutes, ' + numHours + ', ' + numMinutes + ']]';
					} else {
						msg = '[[error:' + languageKey + '-hours, ' + numHours + ']]';
					}
				} else if (numMinutes) {
					if (numSeconds) {
						msg = '[[error:' + languageKey + '-minutes-seconds, ' + numMinutes + ', ' + numSeconds + ']]';
					} else {
						msg = '[[error:' + languageKey + '-minutes, ' + numMinutes + ']]';
					}
				}
				app.alertError(msg);
				return false;
			}
			return true;
		}

		commentContainer.on('click', '[component="comment/restore"]', function () {
			toggleCommentDelete($(this), pid);
		});

		commentContainer.on('click', '[component="comment/purge"]', function () {
			purgeComment($(this), pid);
		});

		commentContainer.on('click', '[component="comment/move"]', function () {
			var btn = $(this);
			//require(['forum/post/move-comment'], function (moveComment) {
				moveComment.init(btn.parents('[data-mid]'));
			//});
		});

	}

	function onReplyClicked(button, pid) {
		var selectedNode = getSelectedNode();

		showStaleWarning(function () {
			var username = getUserSlug(button);
			if (getData(button, 'data-uid') === '0' || !getData(button, 'data-userslug')) {
				username = '';
			}

			var toMid = button.is('[component="comment/reply"]') ? getData(button, 'data-mid') : null;

			if (selectedNode.text && (!toMid || !selectedNode.mid || toMid === selectedNode.mid)) {
				username = username || selectedNode.username;
				$(window).trigger('action:composer.addQuote', {
					pid: pid,
					mid: toMid,
					postName: ajaxify.data.titleRaw,
					username: username,
					text: selectedNode.text,
					selectedMid: selectedNode.mid,
				});
			} else {
				$(window).trigger('action:composer.comment.new', {
					pid: pid,
					mid: toMid,
					postName: ajaxify.data.titleRaw,
					text: username ? username + ' ' : '',
				});
			}
		});
	}

	function onQuoteClicked(button, pid) {
		var selectedNode = getSelectedNode();

		showStaleWarning(function () {
			var username = getUserSlug(button);
			var toMid = getData(button, 'data-mid');

			function quote(text) {
				$(window).trigger('action:composer.addQuote', {
					pid: pid,
					mid: toMid,
					username: username,
					postName: ajaxify.data.titleRaw,
					text: text,
				});
			}

			if (selectedNode.text && toMid && toMid === selectedNode.mid) {
				return quote(selectedNode.text);
			}
			socket.emit('comments.getRawComment', toMid, function (err, comment) {
				if (err) {
					return app.alertError(err.message);
				}

				quote(comment);
			});
		});
	}

	function getSelectedNode() {
		var selectedText = '';
		var selectedMid;
		var username = '';
		var selection = window.getSelection ? window.getSelection() : document.selection.createRange();
		var commentContents = $('[component="comment"] [component="comment/content"]');
		var content;
		commentContents.each(function (index, el) {
			if (selection && selection.containsNode && el && selection.containsNode(el, true)) {
				content = el;
			}
		});

		if (content) {
			var bounds = document.createRange();
			bounds.selectNodeContents(content);
			var range = selection.getRangeAt(0).cloneRange();
			if (range.compareBoundaryPoints(Range.START_TO_START, bounds) < 0) {
				range.setStart(bounds.startContainer, bounds.startOffset);
			}
			if (range.compareBoundaryPoints(Range.END_TO_END, bounds) > 0) {
				range.setEnd(bounds.endContainer, bounds.endOffset);
			}
			bounds.detach();
			selectedText = range.toString();
			var commentEl = $(content).parents('[component="comment"]');
			selectedMid = commentEl.attr('data-mid');
			username = getUserSlug($(content));
			range.detach();
		}
		return { text: selectedText, mid: selectedMid, username: username };
	}

	function bookmarkComment(button, mid) {
		var method = button.attr('data-bookmarked') === 'false' ? 'comments.bookmark' : 'comments.unbookmark';

		socket.emit(method, {
			mid: mid,
			room_id: 'post_' + ajaxify.data.pid,
		}, function (err) {
			if (err) {
				app.alertError(err.message);
			}
		});

		return false;
	}

	function getData(button, data) {
		return button.parents('[data-mid]').attr(data);
	}

	function getUserSlug(button) {
		var slug = '';
		var comment = button.parents('[data-mid]');

		if (button.attr('component') === 'post/reply') {
			return slug;
		}

		if (comment.length) {
			slug = utils.slugify(comment.attr('data-username'), true);
		}
		if (comment.length && comment.attr('data-uid') !== '0') {
			slug = '@' + slug;
		}

		return slug;
	}

	function toggleCommentDelete(button, pid) {
		var mid = getData(button, 'data-mid');
		var commentEl = components.get('comment', 'mid', mid);
		var action = !commentEl.hasClass('deleted') ? 'delete' : 'restore';

		commentAction(action, mid, pid);
	}

	function purgeComment(button, pid) {
		commentAction('purge', getData(button, 'data-mid'), pid);
	}

	function commentAction(action, mid, pid) {
		translator.translate('[[post:comment_' + action + '_confirm]]', function (msg) {
			bootbox.confirm(msg, function (confirm) {
				if (!confirm) {
					return;
				}

				socket.emit('comments.' + action, {
					mid: mid,
					pid: pid,
				}, function (err) {
					if (err) {
						app.alertError(err.message);
					}
				});
			});
		});
	}
	function showStaleWarning(callback) {
		var staleThreshold = Math.min(Date.now() - (1000 * 60 * 60 * 24 * ajaxify.data.postStaleDays), 8640000000000000);
		if (staleReplyAnyway || ajaxify.data.lastcommenttime >= staleThreshold) {
			return callback();
		}

		translator.translate('[[post:stale.warning]]', function (translated) {
			var warning = bootbox.dialog({
				title: '[[post:stale.title]]',
				message: translated,
				buttons: {
					reply: {
						label: '[[post:stale.reply_anyway]]',
						className: 'btn-link',
						callback: function () {
							staleReplyAnyway = true;
							callback();
						},
					},
					create: {
						label: '[[post:stale.create]]',
						className: 'btn-primary',
						callback: function () {
							///translator.translate('[[post:link_back, ' + ajaxify.data.title + ', ' + config.relative_path + '/post/' + ajaxify.data.slug + ']]', function (body) {
							translator.translate('[[post:link_back, ' + ajaxify.data.title + ', ' +  app.pageBasePath + '/post/' + ajaxify.data.slug + ']]', function (body) {
								$(window).trigger('action:comment.post.new', {
									cid: ajaxify.data.cid,
									body: body,
								});
							});
						},
					},
				},
			});

			warning.modal();
		});
	}

	return CommentTools;
});
