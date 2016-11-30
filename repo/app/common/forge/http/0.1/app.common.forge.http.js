app_common.config(function ($provide, _forge) {
    if (_forge) {

        $provide.provider('$httpBackend', function () {
            this.$get = function (_log) {
                return function (method, url, post, callback, headers, timeout, withCredentials) {
                    _log.debug("Sending AJAX request by url " + url);

                    forge.ajax({
                        type:method,
                        url:url,
                        data:post,
                        headers:headers,
                        contentType: headers['Content-Type'],

                        success:function (data) {
                            _log.debug("Successful response for " + url + " : " + data);

                            callback(200, data);
                        },
                        error:function (error) {
                            _log.debug("Error response for " + url, error, post);

                            callback(error.statusCode, error.content);
                        }
                    });
                };
            };
        });


//            //we need to change $http implementation
//            $provide.provider('$http', function() {
//
//                //copied from angularJs... add params to url
//                function buildUrl(url, params) {
//                    if (!params) return url;
//                    var parts = [];
//                    angular.forEach(params, function(value, key) {
//                        if (value == null || value == undefined) return;
//                        if (angular.isObject(value)) {
//                            value = angular.toJson(value);
//                        }
//                        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
//                    });
//                    return url + ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
//                }
//
//                this.responseInterceptors = [];
//                this.$get = function($q, $timeout, _log) {
//                    var processAjaxResponse = function(deferred, success, response) {
//                        $timeout(function() {
//                            if (success) {
//                                deferred.resolve(response);
//                            } else {
//                                deferred.reject(response);
//                            }
//                        }, 10);
//                    };
//
//                    var doCall = function(method, url, requestData, config, deferred) {
//
//                        var finalUrl = buildUrl(url, config.params);
//
//                        _log.debug("Sending AJAX request by url " + finalUrl);
//
//                        forge.ajax({
//                            type: method,
//                            url: finalUrl,
//                            data: requestData,
//                            headers: config.headers,
//
//                            success: function(data) {
//                                _log.debug("Successful response for " + finalUrl + " : " + data);
//
//                                processAjaxResponse(deferred, true, {data: data, status: 200, headers: null, config: config});
//                            },
//                            error: function(error) {
//                                _log.debug("Error response for " + finalUrl, error, config, requestData);
//
//                                processAjaxResponse(deferred, false, {data: error.content, status: error.statusCode, headers: null, config: config});
//                            }
//                        });
//                    };
//
//                    var addCommonPromiseMethods = function(deferred, config) {
//                        var promise = deferred.promise;
//
//                        //add custom angular methods
//                        promise.success = function(fn) {
//                            promise.then(function(response) {
//                                fn(response.data, response.status, response.headers, config);
//                            });
//                            return promise;
//                        };
//
//                        //add custom angular methods
//                        promise.error = function(fn) {
//                            promise.then(null, function(response) {
//                                fn(response.data, response.status, response.headers, config);
//                            });
//                            return promise;
//                        };
//                    };
//
//                    var get = function(url, c) {
//                        var deferred = $q.defer();
//                        var config = c || {};
//
//                        addCommonPromiseMethods(deferred, config);
//
//                        //I don't know why this logic is assigned to $http service
//                        var template = document.getElementById(url);
//                        if (template) {
//                            _log.debug("Loaded template with id " + url);
//
//                            deferred.resolve({data: $(template).html()});
//                        } else {
//                            doCall('GET', url, config.data, config, deferred);
//                        }
//
//                        return deferred.promise;
//                    };
//
//                    var post = function(url, data, c) {
//                        var deferred = $q.defer();
//                        var config = c || {};
//
//                        addCommonPromiseMethods(deferred, config);
//                        doCall('POST', url, data, config, deferred);
//
//                        return deferred.promise;
//                    };
//
//                    return {
//                        get: get,
//                        post: post
//                    }
//                }
//            });
    }
})