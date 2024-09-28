define([
	"skylark-jquery",
	'slax-skybb-base/misc/navigator', 
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components', 
	'slax-skybb-base/misc/wordpadify', 
	'./list'
], function ($,navigator, socket, components, wordpadify,CommentList) {
	'use strict';
	
	var CommentCreate = {};


	CommentCreate.init = function(inputEl) {
		if (inputEl.length) {
			wordpadify(inputEl[0],{
				toolbar : "mini"
			});			
		}
	};

	CommentCreate.send = function(inputEl) {
	    let wdpad = inputEl.data("wordpad");
		var content = wdpad.getValue();
		var mid = inputEl.attr('data-mid');
		var pid = inputEl.closest('[data-pid]').attr('data-pid');

		if (!content.trim().length) {
			return;
		}

		wdpad.setValue('');
		inputEl.removeAttr('data-mid');

	    var commentData = {
	      pid: pid,
	      content: content,
	      mid: mid      
	    };

		$(window).trigger('action:comment.sent', commentData);

		if (!mid) {
			socket.emit('comments.create', commentData, function (err,data) {
				if (err) {
					wdpad.setValue(content);
					//messages.updateRemainingLength(inputEl.parent());
					//if (err.message === '[[error:email-not-confirmed-chat]]') {
					//	return app.showEmailConfirmWarning(err);
					//}

					return app.alert({
						alert_id: 'chat_spam_error',
						title: '[[global:alert.error]]',
						message: err.message,
						type: 'danger',
						timeout: 10000,
					});
				}
				data.user = app.user;
				app.parseAndTranslate('partials/comments/item', {comments:data}, function (html) {
					var replies = $('[component="post"][data-pid="' + pid + '"] .comment-list').first();
					if (replies.length) {
						replies.append(html);
					}
				});

			});
		} else {
			socket.emit('comments.edit',commentData, function (err) {
				if (err) {
					inputEl.val(content);
					inputEl.attr('data-mid', mid);
					//messages.updateRemainingLength(inputEl.parent());
					return app.alertError(err.message);
				}
			});
		}

	};

	return CommentCreate;
});