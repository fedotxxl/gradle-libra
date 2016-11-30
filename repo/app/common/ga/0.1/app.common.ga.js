app_common.
    factory('c_ga', function(c_ga_url) {
        var _gaq = [];
        var initGoogleAnalytics = function() {
            _gaq.push(['_setAccount', 'UA-27329659-2']);
            _gaq.push(['_trackPageview']);

            (function() {
                var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                ga.src = c_ga_url();
                var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
            })();
        };

        var tackExceptionByGoogleAnalytics = function(msg1, msg2) {
            _gaq.push([
                '_trackEvent',
                'error',
                msg1 + '',
                msg2 + ''
            ]);
        };

        var trackJavaScriptExceptions = function() {
            window.onerror = function(message, file, lineNumber) {
                tackExceptionByGoogleAnalytics(file + ':' + lineNumber, message);
            };
        };

        return {
            initGoogleAnalytics: initGoogleAnalytics,
            tackExceptionByGoogleAnalytics: tackExceptionByGoogleAnalytics,
            trackJavaScriptExceptions: trackJavaScriptExceptions
        }
    })