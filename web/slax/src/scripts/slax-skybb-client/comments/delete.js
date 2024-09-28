define([
	"skylark-jquery",
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components', 
	'./select'
], function ($, socket, components, postSelect) {
	'use strict';
	var commentDelete = {};
	var modal;
	var deleteBtn;
	var purgeBtn;
	var tid;

	commentDelete.init = function () {
		tid = ajaxify.data.tid;

		$(window).off('action:ajaxify.end', onAjaxifyEnd).on('action:ajaxify.end', onAjaxifyEnd);

		if (modal) {
			return;
		}

		app.parseAndTranslate('partials/delete_comments_modal', {}, function (html) {
			modal = html;

			$('body').append(modal);

			deleteBtn = modal.find('#delete_comments_confirm');
			purgeBtn = modal.find('#purge_comments_confirm');

			modal.find('.close,#delete_comments_cancel').on('click', closeModal);

			commentSelect.init(function () {
				checkButtonEnable();
				showCommentsSelected();
			});
			showCommentsSelected();

			deleteBtn.on('click', function () {
				deleteComments(deleteBtn, 'comments.deleteComments');
			});
			purgeBtn.on('click', function () {
				deleteComments(purgeBtn, 'comments.purgeComments');
			});
		});
	};

	function onAjaxifyEnd() {
		if (ajaxify.data.template.name !== 'topic' || ajaxify.data.tid !== tid) {
			closeModal();
			$(window).off('action:ajaxify.end', onAjaxifyEnd);
		}
	}

	function deleteComments(btn, command) {
		btn.attr('disabled', true);
		socket.emit(command, {
			tid: ajaxify.data.tid,
			mids: commentSelect.mids,
		}, function (err) {
			btn.removeAttr('disabled');
			if (err) {
				return app.alertError(err.message);
			}

			closeModal();
		});
	}

	function showCommentsSelected() {
		if (commentSelect.mids.length) {
			modal.find('#mids').translateHtml('[[topic:fork_mid_count, ' + commentSelect.mids.length + ']]');
		} else {
			modal.find('#mids').translateHtml('[[topic:fork_no_mids]]');
		}
	}

	function checkButtonEnable() {
		if (commentSelect.mids.length) {
			deleteBtn.removeAttr('disabled');
			purgeBtn.removeAttr('disabled');
		} else {
			deleteBtn.attr('disabled', true);
			purgeBtn.attr('disabled', true);
		}
	}

	function closeModal() {
		if (modal) {
			modal.remove();
			modal = null;
			commentSelect.disable();
		}
	}

	return commentDelete;
});
