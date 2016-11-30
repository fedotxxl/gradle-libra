app_common.
    factory('$exceptionHandler', function($injector, $log, c_router, c_ga) {
        //handle angular exception
        return function(exception, cause) {
            //post to site
            var http = $injector.get('$http');
            http.post(c_router.exception, { error: exception.stack, location: window.location.href });

            //ga
            c_ga.tackExceptionByGoogleAnalytics(exception, cause);

            alert(exception);

            //console log
            $log.error.apply($log, arguments);
        };
    });