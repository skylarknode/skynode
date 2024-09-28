define([
	"skylark-jquery"
],function($) {
	function wordpadify(textarea, data) {
		var textDirection = $('html').attr('data-dir');

		$(window).trigger('action:wordpad.load', Wordpad);
		$(window).off('action:wordpad.load');

		var options = {
			direction: textDirection || undefined,
	        srcNodeRef: textarea,
	        pasteImage: true,
	        autosave: 'editor-content',
	      addons : {
	        "general" : [
	         ],
	         actions : {
	            image : {
	              ///placeholderImage: config.relative_path + '/assets/images/image-default.png'
	              placeholderImage: app.assetsBaseurl + '/assets/images/image-default.png'
	            },
	            video :  {
	              ///placeholderPoster : config.relative_path + '/assets/images/video-poster-default.jpg'
	              placeholderPoster : app.assetsBaseurl + '/assets/images/video-poster-default.jpg'
	            },
	            threed :  {
	              ///placeholderPoster : config.relative_path + '/assets/images/threed-poster-default.jpg'
	              placeholderPoster : app.assetsBaseurl + '/assets/images/threed-poster-default.jpg'
	            }
	         },
	         toolbar : {
	          items : {
	            emoji : {
	              ///imagePath: config.relative_path + "/assets/images/emoji/"
	              imagePath: app.assetsBaseurl + "/assets/images/emoji/"
	            }
	          }
	         }
	      }

		};

		if (data.height) {
			options.maxHeight = parseInt(data.height, 10) || undefined;
		}

		if (data.onChange && typeof data.onChange === 'function') {
			options.callbacks = options.callbacks || {};
			options.callbacks.change = data.onChange;
		}

	    var $preview, miniToolbar, toolbar;
	    toolbar = ['html','|','title', 'bold', 'italic', 'underline', 'strikethrough', 'fontScale', 'color', 'mark','|', 'ol', 'ul', 'blockquote', 'code', 'table', '|', 'emoji','link', 'image', 'video','threed','hr', '|', 'indent', 'outdent', 'alignment','|','fullscreen'];
	    miniToolbar = ["bold", "underline", "strikethrough", "color", 'mark',"ul", "ol"];
	    if (data.isChat || mobilecheck()) {
	      toolbar = miniToolbar;
	    }

	    options.toolbar = toolbar;

		if (config.allowFileUploads) {
	       options.upload =  {
	        ///url: config.relative_path + '/api/post/upload',
	        url: app.apiBaseUrl + '/api/post/upload',
			fileKey : 'files[]',
			headers : {
				"x-csrf-token": config.csrf_token				
			},
			uploadedImagePath : function(result) {
				return result[0].url;
			}
		   };
		}

	    editor = new Wordpad(options);
	}

	return wordpadify;
});