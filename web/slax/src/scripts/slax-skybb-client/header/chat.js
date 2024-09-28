define([
	"skylark-jquery",
	"slax-skybb-base/socket",
	'slax-skybb-base/misc/components',
	'slax-skybb-base/misc/chat'
], function ($,socket,components,_chat) {
	'use strict';
	
	var chat = {};

	chat.prepareDOM = function () {
		var chatsToggleEl = components.get('chat/dropdown');
		var chatsListEl = components.get('chat/list');

		chatsToggleEl.on('click', function () {
			if (chatsToggleEl.parent().hasClass('open')) {
				return;
			}
			requireAndCall('loadChatsDropdown', chatsListEl);
		});

		if (chatsToggleEl.parents('.dropdown').hasClass('open')) {
			requireAndCall('loadChatsDropdown', chatsListEl);
		}

		socket.removeListener('event:chats.receive', onChatMessageReceived);
		socket.on('event:chats.receive', onChatMessageReceived);

		socket.removeListener('event:user_status_change', onUserStatusChange);
		socket.on('event:user_status_change', onUserStatusChange);

		socket.removeListener('event:chats.roomRename', onRoomRename);
		socket.on('event:chats.roomRename', onRoomRename);
	};

	function onChatMessageReceived(data) {
		requireAndCall('onChatMessageReceived', data);
	}

	function onUserStatusChange(data) {
		requireAndCall('onUserStatusChange', data);
	}

	function onRoomRename(data) {
		requireAndCall('onRoomRename', data);
	}

	function requireAndCall(method, param) {
		//require(['chat'], function (chat) {
			_chat[method](param);
		//});
	}

	return chat;
});
