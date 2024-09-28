//moved from slax-skybb-misc by lwf
define([
	'slax-skybb-base/misc/components'
], function (components) {
	'use strict';
	var CommentSelect = {};
	var onSelect;

	CommentSelect.mids = [];

	CommentSelect.init = function (_onSelect) {
		CommentSelect.mids.length = 0;
		onSelect = _onSelect;
		$('#content').on('click', '[component="post"] [component="comment"]', onCommentClicked);
		disableClicksOnComments();
	};

	function onCommentClicked() {
		CommentSelect.toggleCommentSelection($(this));
	}

	CommentSelect.disable = function () {
		CommentSelect.mids.forEach(function (mid) {
			components.get('comment', 'mid', mid).toggleClass('bg-success', false);
		});

		$('#content').off('click', '[component="post"] [component="comment"]', onCommentClicked);
		enableClicksOnComments();
	};

	CommentSelect.toggleCommentSelection = function (comment) {
		var newMid = comment.attr('data-mid');

		if (parseInt(comment.attr('data-index'), 10) === 0) {
			return;
		}

		if (newMid) {
			var index = CommentSelect.mids.indexOf(newMid);
			if (index === -1) {
				CommentSelect.mids.push(newMid);
				comment.toggleClass('bg-success', true);
			} else {
				CommentSelect.mids.splice(index, 1);
				comment.toggleClass('bg-success', false);
			}

			if (CommentSelect.mids.length) {
				CommentSelect.mids.sort(function (a, b) { return a - b; });
			}
			if (typeof onSelect === 'function') {
				onSelect();
			}
		}
	};


	function disableClicks() {
		return false;
	}

	function disableClicksOnComments() {
		$('#content').on('click', '[component="comment"] button, [component="comment"] a', disableClicks);
	}

	function enableClicksOnComments() {
		$('#content').off('click', '[component="comment"] button, [component="comment"] a', disableClicks);
	}

	return CommentSelect;
});
