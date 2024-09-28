define([
	'skylark-langx/langx',
	'skylark-jquery',
	'skylark-bootbox4',
	'skylark-sortable',
	'skylark-slideout',
	'skylark-bootstrap3/loadedInit',
	'skylark-tinycon',
	'skylark-benchpress',
	'./misc/helpers',
	'./misc/taskbar',
	'./misc/translator',
	'./misc/components',
	'./misc/pagination',
	"./misc/chat",
	"./misc/search",
	"./app",
	"./ajaxify",
	"./socket",
	"./utils",
	"./overrides"
], function (
	langx, 
	$, 
	bootbox, 
	Sortable, 
	Slideout, 
	b3LoadedInit, 
	Tinycon, 
	Benchpress,
	helpers,
	taskbar,
	translator , 
	components,
	pagination,
	chat,
	search,
	app,
	ajaxify,
	socket,
	utils,
	overrides
) {
	'use strict';

	window.bootbox = bootbox;
	window.Sortable = Sortable;
	window.Slideout = Slideout;


	b3LoadedInit();
	window.Tinycon = Tinycon;


	app.currentRoom = null;
	app.cacheBuster = null;

	(function () {
		var params = utils.params();
		var showWelcomeMessage = !!params.loggedin;
		var registerMessage = params.register;
		var isTouchDevice = utils.isTouchDevice();
		// require(['benchpress'], function (Benchpress) {
		Benchpress.setGlobal('config', config);
		if (Object.defineProperty) {
			Object.defineProperty(window, 'templates', {
				configurable: true,
				enumerable: true,
				get: function () {
					console.warn('[deprecated] Accessing benchpress (formerly known as templates.js) globally is deprecated. Use `require(["benchpress"], function (Benchpress) { ... })` instead');
					return Benchpress;
				},
			});
		} else {
			window.templates = Benchpress;
		}
		// });

		app.cacheBuster = config['cache-buster'];

		bootbox.setDefaults({
			locale: config.userLang,
		});

	}());

	function init () {

	    var location = document.location || window.location;
		var rootUrl = location.protocol + '//' + (location.hostname || location.host) + (location.port ? ':' + location.port : '');


		// Dumb hack to fool ajaxify into thinking translator is still a global
		// When ajaxify is migrated to a require.js module, then this can be merged into the "define" call
		// require(['translator', 'benchpress'], function (_translator, _Benchpress) {
		//	translator = _translator;
		translator.translate('[[error:no-connection]]');
		//	Benchpress = _Benchpress;
		// });

		$(window).on('popstate', function (ev) {
			ev = ev.originalEvent;

			if (ev !== null && ev.state) {
				if (ev.state.url === null && ev.state.returnPath !== undefined) {
					window.history.replaceState({
						url: ev.state.returnPath,
					///}, ev.state.returnPath, config.relative_path + '/' + ev.state.returnPath);
					}, ev.state.returnPath, app.pageBasePath + '/' + ev.state.returnPath);
				} else if (ev.state.url !== undefined) {
					ajaxify.go(ev.state.url, function () {
						$(window).trigger('action:popstate', { url: ev.state.url });
					}, true);
				}
			}
		});

		function ajaxifyAnchors() {
			function hrefEmpty(href) {
				return href === undefined || href === '' || href === 'javascript:;';
			}

			var contentEl = document.getElementById('content');

			// Enhancing all anchors to ajaxify...
			$(document.body).on('click', 'a', function (e) {
				var _self = this;
				if (this.target !== '' || (this.protocol !== 'http:' && this.protocol !== 'https:')) {
					return;
				}

				///var internalLink = utils.isInternalURI(this, window.location, config.relative_path);
				var internalLink = utils.isInternalURI(this, window.location, app.pageBasePath);

				var process = function () {
					if (!e.ctrlKey && !e.shiftKey && !e.metaKey && e.which === 1) {
						if (internalLink) {
							///var pathname = this.href.replace(rootUrl + config.relative_path + '/', '');
							var pathname = this.href.replace(rootUrl + app.pageBasePath + '/', '');

							// Special handling for urls with hashes
							if (window.location.pathname === this.pathname && this.hash.length) {
								window.location.hash = this.hash;
							} else if (ajaxify.go(pathname)) {
								e.preventDefault();
							}
						///} else if (window.location.pathname !== config.relative_path + '/outgoing') {
						} else if (window.location.pathname !== app.pageBasePath + '/outgoing') {
							if (config.openOutgoingLinksInNewTab && $.contains(contentEl, this)) {
								var externalTab = window.open();
								externalTab.opener = null;
								externalTab.location = this.href;
								e.preventDefault();
							} else if (config.useOutgoingLinksPage) {
								var safeUrls = config.outgoingLinksWhitelist.trim().split(/[\s,]+/g).filter(Boolean);
								var href = this.href;
								if (!safeUrls.length || !safeUrls.some(function (url) { return href.indexOf(url) !== -1; })) {
									ajaxify.go('outgoing?url=' + encodeURIComponent(href));
									e.preventDefault();
								}
							}
						}
					}
				};

				if ($(this).attr('data-ajaxify') === 'false') {
					if (!internalLink) {
						return;
					}
					return e.preventDefault();
				}

				// Default behaviour for rss feeds
				if (internalLink && $(this).attr('href') && $(this).attr('href').endsWith('.rss')) {
					return;
				}

				// Default behaviour for uploads and direct links to API urls
				if (internalLink && ['/uploads', '/assets/uploads/', '/api/'].some(function (prefix) {
					///return String(_self.pathname).startsWith(config.relative_path + prefix);
					return String(_self.pathname).startsWith(app.pageBasePath + prefix);
				})) {
					return;
				}

				if (hrefEmpty(this.href) || this.protocol === 'javascript:' || $(this).attr('href') === '#') {
					return e.preventDefault();
				}

				if (app.flags && app.flags.hasOwnProperty('_unsaved') && app.flags._unsaved === true) {
					if (e.ctrlKey) {
						return;
					}

					translator.translate('[[global:unsaved-changes]]', function (text) {
						bootbox.confirm(text, function (navigate) {
							if (navigate) {
								app.flags._unsaved = false;
								process.call(_self);
							}
						});
					});
					return e.preventDefault();
				}

				process.call(_self);
			});
		}

		Benchpress.registerLoader(ajaxify.loadTemplate);

		if (window.history && window.history.pushState) {
			// Progressive Enhancement, ajaxify available only to modern browsers
			ajaxifyAnchors();
		}

   		app.load();
	}


	return init;
});
