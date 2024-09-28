define([
	"skylark-jquery",
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components', 
	"slax-skybb-base/misc/translator", 
	"skylark-benchpress"
], function ($, socket, components, translator, Benchpress) {
	'use strict';

	var CommentVotes = {};

	CommentVotes.addVoteHandler = function () {
		components.get('post').on('mouseenter', '[data-mid] [component="comment/vote-count"]', loadDataAndCreateTooltip);
		components.get('post').on('mouseout', '[data-mid] [component="comment/vote-count"]', function () {
			var el = $(this).parent();
			el.on('shown.bs.tooltip', function () {
				$('.tooltip').tooltip('destroy');
				el.off('shown.bs.tooltip');
			});

			$('.tooltip').tooltip('destroy');
		});
	};

	function loadDataAndCreateTooltip(e) {
		e.stopPropagation();

		var $this = $(this);
		var el = $this.parent();
		var mid = el.parents('[data-mid]').attr('data-mid');

		$('.tooltip').tooltip('destroy');
		$this.off('mouseenter', loadDataAndCreateTooltip);

		socket.emit('comments.getUpvoters', [mid], function (err, data) {
			if (err) {
				return app.alertError(err.message);
			}

			if (data.length) {
				createTooltip(el, data[0]);
			}
			$this.off('mouseenter').on('mouseenter', loadDataAndCreateTooltip);
		});
		return false;
	}

	function createTooltip(el, data) {
		function doCreateTooltip(title) {
			el.attr('title', title).tooltip('fixTitle').tooltip('show');
		}
		var usernames = data.usernames;
		if (!usernames.length) {
			return;
		}
		if (usernames.length + data.otherCount > 6) {
			usernames = usernames.join(', ').replace(/,/g, '|');
			translator.translate('[[topic:users_and_others, ' + usernames + ', ' + data.otherCount + ']]', function (translated) {
				translated = translated.replace(/\|/g, ',');
				doCreateTooltip(translated);
			});
		} else {
			usernames = usernames.join(', ');
			doCreateTooltip(usernames);
		}
	}


	CommentVotes.toggleVote = function (button, className, method) {
		var comment = button.closest('[data-mid]');
		var currentState = comment.find(className).length;

		socket.emit(currentState ? 'comments.unvote' : method, {
			mid: comment.attr('data-mid'),
			room_id: 'topic_' + ajaxify.data.tid,
		}, function (err) {
			if (err) {
				app.alertError(err.message);
			}

			if (err && err.message === '[[error:not-logged-in]]') {
				ajaxify.go('login');
			}
		});

		return false;
	};

	CommentVotes.showVotes = function (mid) {
		socket.emit('comments.getVoters', { mid: mid, cid: ajaxify.data.cid }, function (err, data) {
			if (err) {
				if (err.message === '[[error:no-privileges]]') {
					return;
				}

				// Only show error if it's an unexpected error.
				return app.alertError(err.message);
			}

			Benchpress.parse('partials/modals/votes_modal', data, function (html) {
				translator.translate(html, function (translated) {
					var dialog = bootbox.dialog({
						title: 'Voters',
						message: translated,
						className: 'vote-modal',
						show: true,
					});

					dialog.on('click', function () {
						dialog.modal('hide');
					});
				});
			});
		});
	};


	return CommentVotes;
});
