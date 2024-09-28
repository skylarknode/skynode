define([
	'skylark-langx/langx',
	'skylark-jquery',
	'skylark-benchpress',
	'./misc/translator',
	"./socket"
],function(langx,$,Benchpress,translator, socket){
	'use strict';
	var ajaxifyTimer;
	var apiXHR = null;
	var retry = true;
	var previousBodyClass = '';


	var ajaxify = window.ajaxify = window.ajaxify || {};

	ajaxify.count = 0;
	ajaxify.currentPage = null;

	ajaxify.go = function (url, callback, quiet) {
		if (!socket.connected) {
			if (ajaxify.reconnectAction) {
				$(window).off('action:reconnected', ajaxify.reconnectAction);
			}
			ajaxify.reconnectAction = function (e) {
				ajaxify.go(url, callback, quiet);
				$(window).off(e);
			};
			$(window).on('action:reconnected', ajaxify.reconnectAction);
		}

		// Abort subsequent requests if clicked multiple times within a short window of time
		if (ajaxifyTimer && (Date.now() - ajaxifyTimer) < 500) {
			return true;
		}
		ajaxifyTimer = Date.now();

		if (ajaxify.handleRedirects(url)) {
			return true;
		}

		app.leaveCurrentRoom();

		$(window).off('scroll');

		if ($('#content').hasClass('ajaxifying') && apiXHR && apiXHR.abort) { // modified by lwf
			apiXHR.abort();
		}

		app.previousUrl = window.location.href;
    	app.previousPath = window.location.pathname;

		url = ajaxify.start(url);

		// If any listeners alter url and set it to an empty string, abort the ajaxification
		if (url === null) {
			$(window).trigger('action:ajaxify.end', { url: url, tpl_url: ajaxify.data.template.name, title: ajaxify.data.title });
			return false;
		}

		// TODO: temporarily modified by lwf for test cors
		previousBodyClass = ajaxify.data.bodyClass || "page-home page-status-200"; 
		$('#footer, #content').removeClass('hide').addClass('ajaxifying');

		ajaxify.loadData(url, function (err, data) {
			if (!err || (err && err.data && (parseInt(err.data.status, 10) !== 302 && parseInt(err.data.status, 10) !== 308))) {
				ajaxify.updateHistory(url, quiet);
			}

			if (err) {
				return onAjaxError(err, url, callback, quiet);
			}

			retry = true;
			app.template = data.template.name;

			renderTemplate(url, data.templateToRender || data.template.name, data, callback);
		});

		return true;
	};

	ajaxify.isCold = function () {
		return ajaxify.count <= 1;
	};

	ajaxify.handleRedirects = function (url) {
		url = ajaxify.removeRelativePath(url.replace(/^\/|\/$/g, '')).toLowerCase();
		///var isClientToAdmin = url.startsWith('admin') && window.location.pathname.indexOf(config.relative_path + '/admin') !== 0;
		var isClientToAdmin = url.startsWith('admin') && window.location.pathname.indexOf(app.pageBasePath + '/admin') !== 0;
		///var isAdminToClient = !url.startsWith('admin') && window.location.pathname.indexOf(config.relative_path + '/admin') === 0;
		var isAdminToClient = !url.startsWith('admin') && window.location.pathname.indexOf(app.pageBasePath + '/admin') === 0;

		if (isClientToAdmin || isAdminToClient) {
			///window.open(config.relative_path + '/' + url, '_top');
			window.open(app.pageBasePath + '/' + url, '_top');
			return true;
		}
		return false;
	};

	ajaxify.start = function (url) {
    	//TODO: temporarily modified by lwf for test cors
    	///const relative_path = "http://localhost:9080";
    	///if (url.startsWith(relative_path)) {
    	if (url.startsWith(app.pageBasePath)) {
      		url = url.slice(app.pageBasePath.length);
    	}

		url = ajaxify.removeRelativePath(url.replace(/^\/|\/$/g, ''));

		var payload = {
			url: url,
		};

		$(window).trigger('action:ajaxify.start', payload);

		ajaxify.count += 1;

		return payload.url;
	};

	ajaxify.updateHistory = function (url, quiet) {
		ajaxify.currentPage = url.split(/[?#]/)[0];
		if (window.history && window.history.pushState) {
			window.history[!quiet ? 'pushState' : 'replaceState']({
				url: url,
			///}, url, config.relative_path + '/' + url);
			}, url, app.pageBasePath + '/' + url);
		}
	};

	function onAjaxError(err, url, callback, quiet) {
		var data = err.data;
		var textStatus = err.textStatus;

		if (data) {
			var status = parseInt(data.status, 10);
			if (status === 403 || status === 404 || status === 500 || status === 502 || status === 503) {
				if (status === 502 && retry) {
					retry = false;
					ajaxifyTimer = undefined;
					return ajaxify.go(url, callback, quiet);
				}
				if (status === 502) {
					status = 500;
				}
				if (data.responseJSON) {
					data.responseJSON.config = config;
				}

				$('#footer, #content').removeClass('hide').addClass('ajaxifying');
				return renderTemplate(url, status.toString(), data.responseJSON || {}, callback);
			} else if (status === 401) {
				app.alertError('[[global:please_log_in]]');
				app.previousUrl = url;
				app.previousPath = url;
				///window.location.href = config.relative_path + '/login';
				window.location.href = app.pageBasePath  + '/login';
			} else if (status === 302 || status === 308) {
				if (data.responseJSON && data.responseJSON.external) {
					window.location.href = data.responseJSON.external;
				} else if (typeof data.responseJSON === 'string') {
					ajaxifyTimer = undefined;
					ajaxify.go(data.responseJSON.slice(1), callback, quiet);
				}
			}
		} else if (textStatus !== 'abort') {
			app.alertError(data.responseJSON.error);
		}
	}

	function renderTemplate(url, tpl_url, data, callback) {
		$(window).trigger('action:ajaxify.loadingTemplates', {});

		Benchpress.parse(tpl_url, data, function (template) {
			translator.translate(template, function (translatedTemplate) {
				translatedTemplate = translator.unescape(translatedTemplate);
				$('body').removeClass(previousBodyClass).addClass(data.bodyClass);
				$('#content').html(translatedTemplate);

		        if (app.assetsBaseUrl) {
		          $('#content').find("img").each(function(i,el){
		            let $el = $(el),srcUrl = $el.attr("src");
		            if (srcUrl.startsWith("/assets")) {
		              $el.attr("src",app.assetsBaseUrl + srcUrl);
		            }
		          })
		        }

				ajaxify.end(url, tpl_url);

				if (typeof callback === 'function') {
					callback();
				}

				$('#content, #footer').removeClass('ajaxifying');

				app.refreshTitle(data.title);
			});
		});
	}

	ajaxify.end = function (url, tpl_url) {
		// TODO: temporarily modified by lwf for test cors
	    if (tpl_url) { 
			ajaxify.loadScript(tpl_url, function done() {
				$(window).trigger('action:ajaxify.end', { url: url, tpl_url: tpl_url, title: ajaxify.data.title });
			});
		} else {
			$(window).trigger('action:ajaxify.end', { url: url, tpl_url: tpl_url, title: ajaxify.data.title });			
		}
		ajaxify.widgets.render(tpl_url);

		$(window).trigger('action:ajaxify.contentLoaded', { url: url, tpl: tpl_url });

		app.processPage();
	};

	ajaxify.parseData = function () {
		var dataEl = $('#ajaxify-data');
		if (dataEl.length) {
			ajaxify.data = JSON.parse(dataEl.text());
			dataEl.remove();
		}
	};

	ajaxify.removeRelativePath = function (url) {
		///if (url.startsWith(config.relative_path.slice(1))) {
		if (url.startsWith(app.pageBasePath.slice(1))) {
			///url = url.slice(config.relative_path.length);
			url = url.slice(app.pageBasePath.length);
		}
		return url;
	};

	ajaxify.refresh = function (callback) {
		ajaxify.go(ajaxify.currentPage + window.location.search + window.location.hash, callback, true);
	};

	ajaxify.loadScript = function (tpl_url, callback) {
		var location = !app.inAdmin ? 'forum/' : '';

		if (tpl_url.startsWith('admin')) {
			location = '';
		}
		var data = {
			tpl_url: tpl_url,
			scripts: [location + tpl_url],
		};

		$(window).trigger('action:script.load', data);

		// Require and parse modules
		var outstanding = data.scripts.length;

		data.scripts.map(function (script) {
			if (typeof script === 'function') {
				return function (next) {
					script();
					next();
				};
			}
			if (typeof script === 'string') {
				return function (next) {
					require([script], function (script) {
						if (script && script.init) {
							script.init();
						}
						next();
					}, function () {
						// ignore 404 error
						next();
					});
				};
			}
			return null;
		}).filter(Boolean).forEach(function (fn) {
			fn(function () {
				outstanding -= 1;
				if (outstanding === 0) {
					callback();
				}
			});
		});
	};

	ajaxify.loadData = function (url, callback) {
		url = ajaxify.removeRelativePath(url);

		$(window).trigger('action:ajaxify.loadingData', { url: url });

		apiXHR = $.ajax({
			// TODO: temporarily modified by lwf for test cors
			///url: config.relative_path + '/api/' + url,
		    ///url: 'http://localhost:5567' + '/api/' + url,  
		    url: app.apiBaseUrl + '/api/' + url,  
			cache: false,
			headers: {
				'X-Return-To': app.previousPath,
			},
			success: function (data, textStatus, xhr) {
				if (!data) {
					return;
				}

				if (xhr.getResponseHeader('X-Redirect')) {
					return callback({
						data: {
							status: 302,
							responseJSON: data,
						},
						textStatus: 'error',
					});
				}

				ajaxify.data = data;
				data.config = config;

				$(window).trigger('action:ajaxify.dataLoaded', { url: url, data: data });

				callback(null, data);
			},
			error: function (data, textStatus) {
				if (data.status === 0 && textStatus === 'error') {
					data.status = 500;
					data.responseJSON = data.responseJSON || {};
					data.responseJSON.error = '[[error:no-connection]]';
				}
				callback({
					data: data,
					textStatus: textStatus,
				});
			},
		});
	};

  	//TODO: temporarily modified by lwf for test cors
  	ajaxify.postData = function (url, callback) {
    	url = ajaxify.removeRelativePath(url);

    	$(window).trigger('action:ajaxify.postingData', { url: url });

    	//apiXHR = $.post('http://localhost:5567' + '/api/' + url, {},function (data, textStatus, xhr) {
    	apiXHR = $.post(app.apiBaseUrl + '/api/' + url, {},function (data, textStatus, xhr) {
      		if (!data) {
        		return;
      		}

      		ajaxify.data = data;

      		$(window).trigger('action:ajaxify.dataPosted', { url: url, data: data });

      		callback(null, data);
    	});
  	};

	ajaxify.loadTemplate = function (template, callback) {
		///require([config.relative_path + '/assets/templates/' + template + '.js'], callback, function (err) {
		require([app.assetsBaseUrl + '/assets/templates/' + template + '.js'], callback, function (err) {
			console.error('Unable to load template: ' + template);
			throw err;
		});
	};

	ajaxify.widgets = {};

	ajaxify.widgets.render = function (template) {
		if (template &&  template.match(/^admin/)) {
			return;
		}

		if (!ajaxify.data) {
			return;
		}
		
		var locations = Object.keys(ajaxify.data.widgets);

		locations.forEach(function (location) {
			var area = $('#content [widget-area="' + location + '"]');
			if (area.length) {
				return;
			}

			var widgetsAtLocation = ajaxify.data.widgets[location] || [];
			var html = '';

			widgetsAtLocation.forEach(function (widget) {
				html += widget.html;
			});

			if (location === 'footer' && !$('#content [widget-area="footer"]').length) {
				$('#content').append($('<div class="row"><div widget-area="footer" class="col-xs-12"></div></div>'));
			} else if (location === 'sidebar' && !$('#content [widget-area="sidebar"]').length) {
				if ($('[component="account/cover"]').length) {
					$('[component="account/cover"]').nextAll().wrapAll($('<div class="row"><div class="col-lg-9 col-xs-12"></div><div widget-area="sidebar" class="col-lg-3 col-xs-12"></div></div></div>'));
				} else if ($('[component="groups/cover"]').length) {
					$('[component="groups/cover"]').nextAll().wrapAll($('<div class="row"><div class="col-lg-9 col-xs-12"></div><div widget-area="sidebar" class="col-lg-3 col-xs-12"></div></div></div>'));
				} else {
					$('#content > *').wrapAll($('<div class="row"><div class="col-lg-9 col-xs-12"></div><div widget-area="sidebar" class="col-lg-3 col-xs-12"></div></div></div>'));
				}
			} else if (location === 'header' && !$('#content [widget-area="header"]').length) {
				$('#content').prepend($('<div class="row"><div widget-area="header" class="col-xs-12"></div></div>'));
			}

			area = $('#content [widget-area="' + location + '"]');
			if (html && area.length) {
				area.html(html);
				area.find('img:not(.not-responsive)').addClass('img-responsive');
			}

			if (widgetsAtLocation.length) {
				area.removeClass('hidden');
			}
		});

		$(window).trigger('action:widgets.loaded', {});
	};

	return ajaxify;

});