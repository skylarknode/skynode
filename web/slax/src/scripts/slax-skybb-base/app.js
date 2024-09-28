define([
	'skylark-langx/langx',
	"skylark-slax-runtime",
	'skylark-jquery',
	'skylark-bootbox4',
	'skylark-benchpress',
	'./misc/helpers',
	'./misc/taskbar',
	'./misc/translator',
	'./misc/components',
	'./misc/pagination',
	"./misc/chat",
	"./misc/search",
	"./socket",
	"./utils",
	"./overrides"
], function (
	langx, 
	slax,
	$, 
	bootbox, 
	Benchpress,
	helpers,
	taskbar,
	translator , 
	components,
	pagination,
	chat,
	search,
	socket,
	utils,
	overrides
) {
	'use strict';
    var isTouchDevice= utils.isTouchDevice();


	var app = window.app = window.app || {};
	/*
	var oldApp = window.app;
	var app = window.app  =	window.shell = new RoutifyShell({
		i18n: {
			locale: 'en',
			translate: langx.proxy(translator.translate, translator),
		},
		alerts: {
			container: components.get('toaster/tray'),
			titles: {
				success: '[[global:alert.success]]',
				error: '[[global:alert.error]]',
			},
		},
		templator: {
			parse: langx.proxy(Benchpress.parse, Benchpress), // template function
		},
		skins: {

		},
	});
	*/

	app.apiBaseUrl = app.apiBaseUrl || "";
	app.assetsBaseUrl = app.assetsBaseUrl || "";
	app.pageBaseUrl = app.pageBaseUrl || "";
	app.pageBasePath = app.pageBasePath || "";

	app.isFocused = true;
	app.currentRoom = null;
	app.widgets = {};
	app.cacheBuster = null;

	/*
	if (oldApp) {
		langx.mixin(app,oldApp);
	}
	*/
	langx.mixin(app,{

		load : function () {
			var self = this;

			function createHeaderTooltips() {
				var env = utils.findBootstrapEnvironment();
				if (env === 'xs' || env === 'sm' || isTouchDevice) {
					return;
				}
				$('#header-menu li a[title]').each(function () {
					$(this).tooltip({
						placement: 'bottom',
						trigger: 'hover',
						title: $(this).attr('title'),
					});
				});


				$('#search-form').parent().tooltip({
					placement: 'bottom',
					trigger: 'hover',
					title: $('#search-button i').attr('title'),
				});


				$('#user_dropdown').tooltip({
					placement: 'bottom',
					trigger: 'hover',
					title: $('#user_dropdown').attr('title'),
				});
			}

			function handleStatusChange() {
				$('[component="header/usercontrol"] [data-status]').off('click').on('click', function (e) {
					var status = $(this).attr('data-status');
					socket.emit('user.setStatus', status, function (err) {
						if (err) {
							return self.alertError(err.message);
						}
						$('[data-uid="' + app.user.uid + '"] [component="user/status"], [component="header/profilelink"] [component="user/status"]')
							.removeClass('away online dnd offline')
							.addClass(status);
						$('[component="header/usercontrol"] [data-status]').each(function () {
							$(this).find('span').toggleClass('bold', $(this).attr('data-status') === status);
						});
						app.user.status = status;
					});
					e.preventDefault();
				});
			}

			this.loadProgressiveStylesheet();

			overrides.overrideTimeago();

			ajaxify.parseData(); // by lwf
			var url = ajaxify.start(window.location.pathname.slice(1) + window.location.search + window.location.hash);
			ajaxify.updateHistory(url, true);
			ajaxify.end(url, app.template);

			handleStatusChange();

			if (config.searchEnabled) {
				this.handleSearch();
			}

			$('body').on('click', '#new_topic',  (e) => {
				e.preventDefault();
				this.newTopic();
			});

			//$('#header-menu .container').on('click', '[component="user/logout"]', app.logout);
			$('#header-menu').on('click', '[component="user/logout"]', app.logout); //modified by lwf


			createHeaderTooltips();
			this.showEmailConfirmWarning();
			this.showCookieWarning();

			socket.removeAllListeners('event:nodebb.ready');
			socket.on('event:nodebb.ready', function (data) {
				if ((data.hostname === app.upstreamHost) && (!app.cacheBuster || app.cacheBuster !== data['cache-buster'])) {
					app.cacheBuster = data['cache-buster'];

					app.alert({
						alert_id: 'forum_updated',
						title: '[[global:updated.title]]',
						message: '[[global:updated.message]]',
						clickfn: function () {
							window.location.reload();
						},
						type: 'warning',
					});
				}
			});
			socket.on('event:livereload', function () {
				if (app.user.isAdmin && !ajaxify.currentPage.match(/admin/)) {
					window.location.reload();
				}
			});

			//require(['taskbar', 'helpers', 'forum/pagination'], function (taskbar, helpers, pagination) {
				taskbar.init();

				helpers.register();

				pagination.init();

				$(window).trigger('action:app.load');

		        // TODO: temporarily modified by lwf for test cors
		        if (!ajaxify.data) {
			        ajaxify.postData("session/initialize",function(err,data){
		              if (data.header.useCustomHTML) {
		                $("head").append(data.header.customHTML);
		              }
		              if (data.header.useCustomCSS) {
		                $("head").append("<style>\n"+data.header.customCSS+"\n</style>");
		              }
		              if (data.footer.useCustomJS) {
                 		$("body").append($("<div/>").html("<script>\n"+data.footer.customJS+"\n</" + "script>"));
		              }
					  app.updateHeader(data,function(){
			            ajaxify.refresh(); 
			          });
			        });  		        	
		        }

			//});
		},

		updateHeader : function (data, callback) {
			/**
			 * data:
			 *   header (obj)
			 *   config (obj)
			 *   next (string)
			 */
			require([
				'forum/unread',
				'forum/header/notifications',
				'forum/header/chat',
			], function (Unread, Notifications, Chat) {
				app.user = data.header.user;
				data.header.config = data.config;
				config = data.config;
				Benchpress.setGlobal('config', config);

				var htmlEl = $('html');
				htmlEl.attr('data-dir', data.header.languageDirection);
				htmlEl.css('direction', data.header.languageDirection);

				// Manually reconnect socket.io
				socket.close();
				socket.open();

				// Re-render top bar menu
				var toRender = {
					//menu: $('#header-menu .container'),
					menu: $('#header-menu'), // modified by lwf
					'chats-menu': $('#chats-menu'),
					'slideout-menu': $('.slideout-menu'),
				};
				Promise.all(Object.keys(toRender).map(function (tpl) {
					return Benchpress.render('partials/' + tpl, data.header).then(function (render) {
						return translator.Translator.create().translate(render);
					});
				})).then(function (html) {
					Object.values(toRender).forEach(function (element, idx) {
						element.html(html[idx]);
					});
					Unread.initUnreadTopics();
					Notifications.prepareDOM();
					Chat.prepareDOM();
					app.reskin(data.header.bootswatchSkin);
					translator.switchTimeagoLanguage(callback);
					bootbox.setLocale(config.userLang);

					if (config.searchEnabled) {
						app.handleSearch();
					}

					$(window).trigger('action:app.updateHeader');
				});
			});
		},

		logout : function (e) {
			if (e) {
				e.preventDefault();
			}
			$(window).trigger('action:app.logout');

			/*
				Set session refresh flag (otherwise the session check will trip and throw invalid session modal)
				We know the session is/will be invalid (uid mismatch) because the user is logging out
			*/
			app.flags = app.flags || {};
			app.flags._sessionRefresh = true;


	        //TODO: temporarily modified by lwf for test cors
      		//$.ajax(config.relative_path + '/logout', {
			///$.ajax('http://localhost:5567/logout', {
			$.ajax(app.apiBaseUrl + '/logout', {
				type: 'POST',
				headers: {
					'x-csrf-token': config.csrf_token,
				},
				success: function (data) {
					// ACP logouts go to frontend via page load, not ajaxify
					if (ajaxify.data.template.name.startsWith('admin/')) {
						$(window).trigger('action:app.loggedOut', data);
						///window.location.href = config.relative_path + (data.next || '/');
						window.location.href = app.pageBasePath + (data.next || '/');
						return;
					}

					app.updateHeader(data, function () {
						// Overwrite in hook (below) to redirect elsewhere
						data.next = data.next || undefined;

						$(window).trigger('action:app.loggedOut', data);
						if (data.next) {
							if (data.next.startsWith('http')) {
								window.location.href = data.next;
								return;
							}

							ajaxify.go(data.next);
						} else {
							ajaxify.refresh();
						}
					});
				},
			});
		},

		alert : function (params) {
			slax.page.alert(params);
		},

		removeAlert : function (id) {
			slax.page.removeAlert(id);
		},

		alertSuccess : function (message, timeout) {
			slax.page.alertSuccess(message, timeout);
		},

		alertError : function (message, timeout) {
			slax.page.alertError(message, timeout);
		},

		handleInvalidSession  :function () {
			if (app.flags && app.flags._sessionRefresh) {
				return;
			}

			app.flags = app.flags || {};
			app.flags._sessionRefresh = true;

			socket.disconnect();

			//			require(['translator'], function (translator) {
			translator.translate('[[error:invalid-session-text]]', function (translated) {
				bootbox.alert({
					title: '[[error:invalid-session]]',
					message: translated,
					closeButton: false,
					callback: function () {
						window.location.reload();
					},
				});
				//				});
			});
		},

		enterRoom : function (room, callback) {
			callback = callback || function () {};
			if (socket && app.user.uid && app.currentRoom !== room) {
				var previousRoom = app.currentRoom;
				app.currentRoom = room;
				socket.emit('meta.rooms.enter', {
					enter: room,
				}, function (err) {
					if (err) {
						app.currentRoom = previousRoom;
						return app.alertError(err.message);
					}

					callback();
				});
			}
		},

		leaveCurrentRoom : function () {
			if (!socket) {
				return;
			}
			var previousRoom = app.currentRoom;
			app.currentRoom = '';
			socket.emit('meta.rooms.leaveCurrent', function (err) {
				if (err) {
					app.currentRoom = previousRoom;
					return app.alertError(err.message);
				}
			});
		},

		createUserTooltips : function (els, placement) {
			if (isTouchDevice) {
				return;
			}
			els = els || $('body');
			els.find('.avatar,img[title].teaser-pic,img[title].user-img,div.user-icon,span.user-icon').each(function () {
				$(this).tooltip({
					placement: placement || $(this).attr('title-placement') || 'top',
					title: $(this).attr('title'),
				});
			});
		},

		createStatusTooltips : function () {
			if (!isTouchDevice) {
				$('body').tooltip({
					selector: '.fa-circle.status',
					placement: 'top',
				});
			}
		},

		processPage : function () {

			function highlightNavigationLink() {
				$('#main-nav li')
					.removeClass('active')
					.find('a')
					.filter(function (i, x) { return window.location.pathname.startsWith(x.getAttribute('href')); })
					.parent()
					.addClass('active');
			}

			highlightNavigationLink();

			$('.timeago').timeago();

			utils.makeNumbersHumanReadable($('.human-readable-number'));

			utils.addCommasToNumbers($('.formatted-number'));

			app.createUserTooltips();

			app.createStatusTooltips();

			// Scroll back to top of page
			if (!ajaxify.isCold()) {
				window.scrollTo(0, 0);
			}
		},

		showMessages : function () {
			var messages = {
				login: {
					format: 'alert',
					title: '[[global:welcome_back]] ' + app.user.username + '!',
					message: '[[global:you_have_successfully_logged_in]]',
				},
				register: {
					format: 'modal',
				},
			};

			function showAlert(type, message) {
				switch (messages[type].format) {
				case 'alert':
					app.alert({
						type: 'success',
						title: messages[type].title,
						message: messages[type].message,
						timeout: 5000,
					});
					break;

				case 'modal':
					// require(['translator'], function (translator) {
					translator.translate(message || messages[type].message, function (translated) {
						bootbox.alert({
							title: messages[type].title,
							message: translated,
						});
					});
					// });
					break;
				}
			}

			if (showWelcomeMessage) {
				showWelcomeMessage = false;
				$(document).ready(function () {
					showAlert('login');
				});
			}
			if (registerMessage) {
				$(document).ready(function () {
					showAlert('register', decodeURIComponent(registerMessage));
					registerMessage = false;
				});
			}
		},

		openChat : function (roomId, uid) {
			if (!app.user.uid) {
				return app.alertError('[[error:not-logged-in]]');
			}

			//require(['chat'], function (chat) {
				function loadAndCenter(chatModal) {
					chat.load(chatModal.attr('data-uuid'));
					chat.center(chatModal);
					chat.focusInput(chatModal);
				}

				if (chat.modalExists(roomId)) {
					loadAndCenter(chat.getModal(roomId));
				} else {
					socket.emit('modules.chats.loadRoom', { roomId: roomId, uid: uid || app.user.uid }, function (err, roomData) {
						if (err) {
							return app.alertError(err.message);
						}
						roomData.users = roomData.users.filter(function (user) {
							return user && parseInt(user.uid, 10) !== parseInt(app.user.uid, 10);
						});
						roomData.uid = uid || app.user.uid;
						chat.createModal(roomData, loadAndCenter);
					});
				}
			//});
		},

		newChat : function (touid, callback) {
			function createChat() {
				socket.emit('modules.chats.newRoom', { touid: touid }, function (err, roomId) {
					if (err) {
						return app.alertError(err.message);
					}

					if (!ajaxify.data.template.chats) {
						app.openChat(roomId);
					} else {
						ajaxify.go('chats/' + roomId);
					}

					callback(false, roomId);
				});
			}

			callback = callback || function () {};
			if (!app.user.uid) {
				return app.alertError('[[error:not-logged-in]]');
			}

			if (parseInt(touid, 10) === parseInt(app.user.uid, 10)) {
				return app.alertError('[[error:cant-chat-with-yourself]]');
			}
			socket.emit('modules.chats.isDnD', touid, function (err, isDnD) {
				if (err) {
					return app.alertError(err.message);
				}
				if (!isDnD) {
					return createChat();
				}
				bootbox.confirm('[[modules:chat.confirm-chat-with-dnd-user]]', function (ok) {
					if (ok) {
						createChat();
					}
				});
			});
		},

		///app.alternatingTitle = function (title) {
		///	return shell.alternatingTitle(title);
		///};

		refreshTitle : function (title) {
			if (!title) {
				return;
			}
			// require(['translator'], function (translator) {
			title = config.titleLayout.replace(/&#123;/g, '{').replace(/&#125;/g, '}')
				.replace('{pageTitle}', function () { return title; })
				.replace('{browserTitle}', function () { return config.browserTitle; });

			// Allow translation strings in title on ajaxify (#5927)
			title = translator.unescape(title);

			return slax.page.refreshTitle(title);
		},

		toggleNavbar : function (state) {
			var navbarEl = $('.navbar');
			if (navbarEl) {
				navbarEl.toggleClass('hidden', !state);
			}
		},


		handleSearch : function () {
			var searchButton = $('#search-button');
			var searchFields = $('#search-fields');
			var searchInput = $('#search-fields input');

			$('#search-form .advanced-search-link').on('mousedown', function () {
				ajaxify.go('/search');
			});

			//$('#search-form').on('submit', dismissSearch);
			//searchInput.on('blur', dismissSearch);
			//modified by lwf
			$('#search-form:not(.search-box)').on('submit', dismissSearch);
			$('#search-form:not(.search-box) #search-fields input').on('blur', dismissSearch);

			$('#search-form:not(.search-box) #search-button').on('click', function (e) {
				if (!config.loggedIn && !app.user.privileges['search:content']) {
					app.alert({
						message: '[[error:search-requires-login]]',
						timeout: 3000,
					});
					ajaxify.go('login');
					return false;
				}
				e.stopPropagation();

				prepareSearch();
				
				return false;
			});


			function dismissSearch() {
				searchFields.addClass('hidden');
				searchButton.removeClass('hidden');
			}

			function prepareSearch() {
				$('#search-form:not(.search-box) #search-fields').removeClass('hidden');
				$('#search-form:not(.search-box) #search-button').addClass('hidden');
				$('#search-fields input').focus();
			};

			$('#search-form:has(.search-box) #search-button').on('click', function (e) {
				if (!config.loggedIn && !app.user.privileges['search:content']) {
					app.alert({
						message: '[[error:search-requires-login]]',
						timeout: 3000,
					});
					ajaxify.go('login');
					return false;
				}
				e.stopPropagation();

				$('#search-form:has(.search-box)').submit();
				
				return false;
			});



			$('#search-form').on('submit', function () {
				var input = $(this).find('input');
				//require(['search'], function (search) {
					var data = search.getSearchPreferences();
					data.term = input.val();
					search.query(data, function () {
						input.val('');
					});
				//});
				return false;
			});
		},

		updateUserStatus : function (el, status) {
			if (!el.length) {
				return;
			}

			//require(['translator'], function (translator) {
				translator.translate('[[global:' + status + ']]', function (translated) {
					el.removeClass('online offline dnd away')
						.addClass(status)
						.attr('title', translated)
						.attr('data-original-title', translated);
				});
			//});
		},

		newTopic : function (cid, tags) {
			$(window).trigger('action:composer.topic.new', {
				cid: cid || ajaxify.data.cid || 0,
				topicType : ajaxify.data.topicType,
				tags: tags || (ajaxify.data.tag ? [ajaxify.data.tag] : []),
			});
		},

		loadJQueryUI : function (callback) {
			if (typeof $().autocomplete === 'function') {
				return callback();
			}

			var scriptEl = document.createElement('script');
			scriptEl.type = 'text/javascript';
			///scriptEl.src = config.relative_path + '/assets/vendor/jquery/js/jquery-ui.js?' + config['cache-buster'];
			scriptEl.src = app.assetsBaseUrl + '/assets/vendor/jquery/js/jquery-ui.js?' + config['cache-buster'];
			scriptEl.onload = callback;
			document.head.appendChild(scriptEl);
		},

		showEmailConfirmWarning : function (err) {
			if (!config.requireEmailConfirmation || !app.user.uid) {
				return;
			}
			var msg = {
				alert_id: 'email_confirm',
				type: 'warning',
				timeout: 0,
			};

			if (!app.user.email) {
				msg.message = '[[error:no-email-to-confirm]]';
				msg.clickfn = function () {
					app.removeAlert('email_confirm');
					ajaxify.go('user/' + app.user.userslug + '/edit');
				};
				this.alert(msg);
			} else if (!app.user['email:confirmed'] && !app.user.isEmailConfirmSent) {
				msg.message = err ? err.message : '[[error:email-not-confirmed]]';
				msg.clickfn = function () {
					app.removeAlert('email_confirm');
					socket.emit('user.emailConfirm', {}, function (err) {
						if (err) {
							return app.alertError(err.message);
						}
						app.alertSuccess('[[notifications:email-confirm-sent]]');
					});
				};

				this.alert(msg);
			} else if (!app.user['email:confirmed'] && app.user.isEmailConfirmSent) {
				msg.message = '[[error:email-not-confirmed-email-sent]]';
				this.alert(msg);
			}
		},

		parseAndTranslate : function (template, blockName, data, callback) {
			function translate(html, callback) {
				translator.translate(html, function (translatedHTML) {
					translatedHTML = translator.unescape(translatedHTML);
					callback($(translatedHTML));
				});
			}

			if (typeof blockName === 'string') {
				Benchpress.parse(template, blockName, data, function (html) {
					translate(html, callback);
				});
			} else {
				callback = data;
				data = blockName;
				Benchpress.parse(template, data, function (html) {
					translate(html, callback);
				});
			}
		},

		loadProgressiveStylesheet : function () {
			var linkEl = document.createElement('link');
			linkEl.rel = 'stylesheet';
			///linkEl.href = config.relative_path + '/assets/js-enabled.css?' + app.cacheBuster;
			linkEl.href = app.assetsBaseUrl + '/assets/js-enabled.css?' + app.cacheBuster;

			document.head.appendChild(linkEl);
		},

		showCookieWarning : function () {
			//require(['translator', 'storage'], function (translator, storage) {
				if (!config.cookies.enabled || !navigator.cookieEnabled) {
					// Skip warning if cookie consent subsystem disabled (obviously), or cookies not in use
					return;
				///} else if (window.location.pathname.startsWith(config.relative_path + '/admin')) {
				} else if (window.location.pathname.startsWith(app.pageBasePath+ '/admin')) {
					// No need to show cookie consent warning in ACP
					return;
				} else if (storage.getItem('cookieconsent') === '1') {
					return;
				}

				config.cookies.message = translator.unescape(config.cookies.message);
				config.cookies.dismiss = translator.unescape(config.cookies.dismiss);
				config.cookies.link = translator.unescape(config.cookies.link);

				this.parseAndTranslate('partials/cookie-consent', config.cookies, function (html) {
					$(document.body).append(html);
					$(document.body).addClass('cookie-consent-open');

					var warningEl = $('.cookie-consent');
					var dismissEl = warningEl.find('button');
					dismissEl.on('click', function () {
						// Save consent cookie and remove warning element
						storage.setItem('cookieconsent', '1');
						warningEl.remove();
						$(document.body).removeClass('cookie-consent-open');
					});
				});
			//});
		},

		reskin : function (skinName) {
			var clientEl = Array.prototype.filter.call(document.querySelectorAll('link[rel="stylesheet"]'), function (el) {
				///return el.href.indexOf(config.relative_path + '/assets/client-') !== -1;
				return el.href.indexOf(app.assetsBaseUrl + '/assets/client-') !== -1;
			})[0] || null;
			if (!clientEl) {
				return;
			}
			///var cssUrl = config.relative_path + '/assets/client' + (skinName ? '-' + skinName : '') + '.css';
			var cssUrl = app.assetsBaseUrl  + '/assets/client' + (skinName ? '-' + skinName : '') + '.css';

			slax.page.reskin(skinName, cssUrl, clientEl);
		}

	});


	return app;
});
