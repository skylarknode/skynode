define( [
	'skylark-domx-i18n',
	"../utils"
], function (i18n,utils) {
	var adaptor = {};

	var Translator = adaptor.Translator = i18n.Translator;
	adaptor.prepareDOM = i18n.prepareDOM;
	adaptor.unescape = i18n.unescape;
	adaptor.escape = i18n.escape;
	adaptor.compile = i18n.compile;

	Translator.create = function create(language, loader) {
		if (!language) {
			language = adaptor.getLanguage();
		}

		loader = loader || loadNs;

		Translator.cache[language] = Translator.cache[language] || new Translator(language, loader);

		return Translator.cache[language];
	};


	// TODO : config
	function loadNs(language, namespace) {
		///return Promise.resolve(jQuery.getJSON(config.relative_path + '/assets/language/' + language + '/' + namespace + '.json?' + config['cache-buster']));
		return Promise.resolve(jQuery.getJSON(app.assetsBaseUrl + '/assets/language/' + language + '/' + namespace + '.json?' + config['cache-buster']));
	}

	/**
	 * Add translations to the cache
	 */
	adaptor.addTranslation = function addTranslation(language, namespace, translation) {
		Translator.create(language, loadNs).getTranslation(namespace).then(function (translations) {
			assign(translations, translation);
		});
	};

	/**
	 * Get the translations object
	 */
	adaptor.getTranslations = function getTranslations(language, namespace, callback) {
		callback = callback || function () {};
		Translator.create(language, loadNs).getTranslation(namespace).then(callback);
	};

	/**
	 * Legacy translator function for backwards compatibility
	 */
	adaptor.translate = function translate(text, language, callback) {
		// TODO: deprecate?

		var cb = callback;
		var lang = language;
		if (typeof language === 'function') {
			cb = language;
			lang = null;
		}

		if (!(typeof text === 'string' || text instanceof String) || text === '') {
			return cb('');
		}

		return Translator.create(lang, loadNs).translate(text).then(function (output) {
			if (cb) {
				setTimeout(cb, 0, output);
			}
			return output;
		}, function (err) {
			console.warn('Translation failed: ' + err.stack);
		});
	};


	var assign = Object.assign || jQuery.extend;

	function userLangToTimeagoCode(userLang) {
		var mapping = {
			'en-GB': 'en',
			'en-US': 'en',
			'fa-IR': 'fa',
			'pt-BR': 'pt-br',
			nb: 'no',
		};
		return mapping[userLang] || userLang;
	}


	adaptor.load = adaptor.getTranslations;


	/**
	 * Get the language of the current environment, falling back to defaults
	 * @returns {string}
	 */
	adaptor.getLanguage = adaptor.Translator.getLanguage = function getLanguage() {
		lang = utils.params().lang || config.userLang || config.defaultLang || 'en-GB';

		return lang;
	};


	adaptor.toggleTimeagoShorthand = function toggleTimeagoShorthand(callback) {
		function toggle() {
			var tmp = assign({}, jQuery.timeago.settings.strings);
			jQuery.timeago.settings.strings = assign({}, adaptor.timeagoShort);
			adaptor.timeagoShort = assign({}, tmp);
			if (typeof callback === 'function') {
				callback();
			}
		}

		if (!adaptor.timeagoShort) {
			var languageCode = userLangToTimeagoCode(config.userLang);
			if (!config.timeagoCodes.includes(languageCode + '-short')) {
				languageCode = 'en';
			}

			var originalSettings = assign({}, jQuery.timeago.settings.strings);
			///jQuery.getScript(config.relative_path + '/assets/vendor/jquery/timeago/locales/jquery.timeago.' + languageCode + '-short.js').done(function () {
			jQuery.getScript(app.assetsBaseUrl + '/assets/vendor/jquery/timeago/locales/jquery.timeago.' + languageCode + '-short.js').done(function () {
				adaptor.timeagoShort = assign({}, jQuery.timeago.settings.strings);
				jQuery.timeago.settings.strings = assign({}, originalSettings);
				toggle();
			});
		} else {
			toggle();
		}
	};

	adaptor.switchTimeagoLanguage = function switchTimeagoLanguage(callback) {
		// Delete the cached shorthand strings if present
		delete adaptor.timeagoShort;

		var languageCode = userLangToTimeagoCode(config.userLang);
		if (!config.timeagoCodes.includes(languageCode + '-short')) {
			languageCode = 'en';
		}
		///jQuery.getScript(config.relative_path + '/assets/vendor/jquery/timeago/locales/jquery.timeago.' + languageCode + '.js').done(callback);
		jQuery.getScript(app.assetsBaseUrl + '/assets/vendor/jquery/timeago/locales/jquery.timeago.' + languageCode + '.js').done(callback);
	};


	return adaptor;
});
