/**
 * This is super simple http interceptor
 * When server returns 401 code it broadcastes "event:auth-loginRequired" event
 * and redirects user to login page
 */
app_common.config(['$httpProvider', function ($httpProvider) {

        var interceptor = function ($location, $rootScope, $q) {
            function success(response) {
                return response;
            }

            function error(response) {
                if (response.status === 401) {
                    $rootScope.$broadcast('event:auth-loginRequired');
                }

                return $q.reject(response);
            }

            return function (promise) {
                return promise.then(success, error);
            }

        };

        $httpProvider.responseInterceptors.push(interceptor);
    }]).
    run(function($rootScope, c_router, c_config) {
        if (c_config.redirectOnAuthenticationFailure) {
            $rootScope.$on('event:auth-loginRequired', function() {
                window.location.href = c_router.login
            });
        }
    });