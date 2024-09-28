define([
	"skylark-jquery",
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components', 
	"slax-skybb-base/utils",
	'./header', 
	'./sessions'
], function ($, socket, components,utils,header, sessions) {
	'use strict';
	var Info = {};

	Info.init = function () {
		header.init();
		handleModerationNote();
		sessions.prepareSessionRevocation();
	};

	function handleModerationNote() {
		$('[component="account/save-moderation-note"]').on('click', function () {
			var note = $('[component="account/moderation-note"]').val();
			socket.emit('user.setModerationNote', { uid: ajaxify.data.uid, note: note }, function (err) {
				if (err) {
					return app.alertError(err.message);
				}
				$('[component="account/moderation-note"]').val('');
				app.alertSuccess('[[user:info.moderation-note.success]]');
				var timestamp = Date.now();
				var data = [{
					note: note,
					user: app.user,
					timestamp: timestamp,
					timestampISO: utils.toISOString(timestamp),
				}];
				app.parseAndTranslate('account/info', 'moderationNotes', { moderationNotes: data }, function (html) {
					$('[component="account/moderation-note/list"]').prepend(html);
					html.find('.timeago').timeago();
				});
			});
		});
	}

	return Info;
});
