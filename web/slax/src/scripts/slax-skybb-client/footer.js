define( [
	"skylark-jquery",
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components',
	"slax-skybb-base/misc/translator",
	'./unread',
	'./header/notifications',
	'./header/chat',
], function ($,socket, components, translator, Unread, Notifications, Chat) {
	'use strict';
	Notifications.prepareDOM();
	Chat.prepareDOM();
	translator.prepareDOM();

	socket.on('event:unread.updateChatCount', function (count) {
		components.get('chat/icon')
			.toggleClass('unread-count', count > 0)
			.attr('data-content', count > 99 ? '99+' : count);
	});

	if (app.user.uid > 0) {
		Unread.initUnreadTopics();
	}
});
