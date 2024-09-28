define([
	'skylark-langx/langx',
	"skylark-slax-runtime/pages/page",
	'skylark-benchpress',
	'../misc/translator',
	'../misc/components'
], function (
	langx, 
	SlaxPage,
	Benchpress,
	translator , 
	components
) {
	'use strict';


	var Page = SlaxPage.inherit({
		options : {
			i18n: {
				locale: 'en',
				translate: langx.proxy(translator.translate, translator),
			},
			alerts: {
				///container: components.get('toaster/tray'),
				titles: {
					success: '[[global:alert.success]]',
					error: '[[global:alert.error]]',
				},
			},
			templator: {
				parse: langx.proxy(Benchpress.parse, Benchpress), // template function
			},
			skins: {

			}
		},

		_construct : function(options) {
			options.alerts = options.alerts || {};
			options.alerts.container = components.get('toaster/tray');
			SlaxPage.prototype._construct.call(this,options);
		}
	});

	return Page;
});
