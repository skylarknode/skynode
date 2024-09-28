'use strict';

define([
	"skylark-jquery",
	"skylark-jqueryui"
], function ($) {
	var selectable = {};

	selectable.enable = function (containerEl, targets) {
		$(containerEl).selectable({
			filter: targets,
		});
	};

	return selectable;
});
