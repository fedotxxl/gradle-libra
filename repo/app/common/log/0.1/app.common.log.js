app_common.
    factory("_log", function(_logDebug) {
        var debug = function() {
            if (_logDebug) {
                console.log(arguments);
            }
        };

        return {
            debug: debug
        }
    });