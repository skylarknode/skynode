define([
    "skylark-slax-runtime/skylark",
    "skylark-jquery",
    "slax-skybb-base/init"
], function(skylarkjs,$,init) {
    var spa = skylarkjs.appify.spa,
        noder = skylarkjs.domx.noder,
        fx = skylarkjs.domx.fx,
        langx = skylarkjs.langx,
        router = skylarkjs.appify.spa.router;

    return spa.PluginController.inherit({
        klassName: "AppController",
        _showProcessing: function() {
            if (!this._throbber) {
                this._throbber = fx.throb(document.body);
            }

        },
        _hideProcessing: function() {
            if (this._throbber) {
                this._throbber.remove();
                this._throbber = null;
            }
        },

        preparing: function(e) {
        },

        starting: function(e) {
            this._showProcessing();
            init();
        },
        started: function(e) {
            this._hideProcessing();
        }
    });
});