define([
	"skylark-jquery",
	"slax-skybb-base/socket"
//	"../chats"
],function (
	$,
	socket
//	Chats
) {
	'use strict';
	var recent = {};

	recent.init = function () {
		//require(['forum/chats'], function (Chats) {
			$('[component="chat/recent"]').on('click', '[component="chat/recent/room"]', function () { 
				//Chats.switchChat($(this).attr('data-roomid'));
				recent.switchChat($(this).attr('data-roomid'));
			});

			$('[component="chat/recent"]').on('scroll', function () {
				var $this = $(this);
				var bottom = ($this[0].scrollHeight - $this.height()) * 0.9;
				if ($this.scrollTop() > bottom) {
					loadMoreRecentChats();
				}
			});
		//});
	};

	function loadMoreRecentChats() {
		var recentChats = $('[component="chat/recent"]');
		if (recentChats.attr('loading')) {
			return;
		}
		recentChats.attr('loading', 1);
		socket.emit('modules.chats.getRecentChats', {
			uid: ajaxify.data.uid,
			after: recentChats.attr('data-nextstart'),
		}, function (err, data) {
			if (err) {
				return app.alertError(err.message);
			}

			if (data && data.rooms.length) {
				onRecentChatsLoaded(data, function () {
					recentChats.removeAttr('loading');
					recentChats.attr('data-nextstart', data.nextStart);
				});
			} else {
				recentChats.removeAttr('loading');
			}
		});
	}

	function onRecentChatsLoaded(data, callback) {
		if (!data.rooms.length) {
			return callback();
		}

		app.parseAndTranslate('chats', 'rooms', data, function (html) {
			$('[component="chat/recent"]').append(html);
			html.find('.timeago').timeago();
			callback();
		});
	}


	return recent;
});
