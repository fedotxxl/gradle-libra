app_common.
    directive('remoteForm', function ($http) {
        // SOURCE - http://jsfiddle.net/rommsen/kyxrF/1/

        function IllegalArgumentException(message) {
            this.message = message;
        }

        var forEach = angular.forEach,
            noop = angular.noop;

        return {
            'restrict':'A',
            'scope':true,
            'controller':function ($scope, $element, $attrs) {
                var self = this;
                self.formComponents = {};
                self.formComponentNames = [];

                self.registerFormComponent = function (name, ngModel) {
                    self.formComponentNames.push(name);
                    self.formComponents[name] = ngModel;
                };
                self.hasFormComponent = function (name) {
                    return self.formComponents[name] != undefined;
                };
                self.getFormComponent = function (name) {
                    return self.formComponents[name];
                };
                self.clearServerError = function (name) {
                    self.formComponents[name].$setValidity('server', true);
                    $scope.serverValidationError[name] = null;
                };
                self.clearAllServerErrors = function() {
                    _.each(self.formComponentNames, function(name) {
                        self.clearServerError(name);
                    })
                };
                self.getFormComponentError = function (name) {
                    return $scope.serverValidationError[name];
                };

                /**
                 * Every submit should reset the form component, because its possible
                 * that the error is gone, but the form is still not valid
                 */
                self.resetFormComponentsValidity = function () {
                    forEach(self.formComponents, function (component) {
                        component.$setValidity('server', true);
                    });
                };

                $scope.serverValidationError = {};
                $scope.target = $attrs['target'];
                $scope.success = $attrs['success'];
                $scope.method = $attrs['method'] || 'post';
                // error code defaults to 400
                $scope.validation_error_code = $attrs['errorCode'] || 400;
                // property path defaults to propertyPath
                $scope.property_path_key = $attrs['propertyPath'] || 'errorField';
                // message key defaults to message
                $scope.message_key = $attrs['message'] || 'message';
                if ($scope.target == undefined) {
                    throw new IllegalArgumentException('target must be defined');
                }

                $scope.is_submitted = false;
                $scope.submit = function (formData) {
                    $scope.formData = formData;
                    $scope.is_submitted = true;
                    self.resetFormComponentsValidity();
                }
            },

            'link':function (scope, element, attrs, ctrl) {
                scope.$watch('is_submitted', function (is_submitted) {
                    if (!is_submitted) {
                        return;
                    }

                    //send server request
                    $http[scope.method].apply($http, [scope.target, scope.formData])
                        .success(function (response) {
                            if ((typeof scope[scope.success]) == 'function') {
                                scope[scope.success](response);
                            }
                        })
                        .error(function (data, status) {
                            if (status == scope.validation_error_code) {
                                //clear all server errors
                                ctrl.clearAllServerErrors();

                                forEach(data, function (item) {
                                    var form_component_name = item[scope.property_path_key];
                                    if (ctrl.hasFormComponent(form_component_name)) {
                                        ctrl.getFormComponent(form_component_name).$setValidity('server', false);
                                        scope.serverValidationError[form_component_name] = item[scope.message_key];
                                    }
                                });
                            }
                        });
                    scope.is_submitted = false;
                });
            }
        }
    })
    .directive('remoteFormComponent', function () {
        var registerFormComponent = function(scope, attrs, ctrls) {
            var formCtrl = ctrls[0];
            var ngModel = ctrls[1];
            formCtrl.registerFormComponent(attrs.name, ngModel);

            scope.$watch(attrs.ngModel, function (current, prev) {
                if (current != prev) {
                    if (formCtrl.getFormComponentError(attrs.name)) {
                        formCtrl.clearServerError(attrs.name)
                    }
                }
            });
        };

        return {
            'restrict': 'A',
            'require': ['^remoteForm', 'ngModel'],

            'link': function (scope, element, attrs, ctrls) {
                //do main stuff - register form component
                registerFormComponent(scope, attrs, ctrls);
            }
        }
    })
    .directive('remoteFormError', function (c_other) {
        var processRemoteFormError = function(element, attrs) {
            // init simple message container
            var $simpleErrorMessageContainer = $("<p class='remote-form-error'></p>");
            element.before($simpleErrorMessageContainer);

            // init tipsy
            element.tipsy({
                gravity:attrs.tipGravity,
                opacity:0.9,
                trigger:'manual',
                className:attrs.tipClass,
                html: true
            });

            var displayErrorMessage = function(value) {
                //let's clear old values
                $simpleErrorMessageContainer.empty();
                element.tipsy(true).hide();

                if (c_other.isMobile() || c_other.getWindowWidth() <= 640) {
                    //display simple message
                    if (value) $simpleErrorMessageContainer.html(value);
                } else {
                    //display tipsy message
                    if (value) {
                        element.tipsy(true).update({fallback:value}).show();
                    }
                }
            };

            attrs.$observe('remoteFormError', function (value) {
                displayErrorMessage(value);
            });
        };

        return {
            'restrict':'A',

            'link':function (scope, element, attrs) {
                //process error response
                processRemoteFormError(element, attrs);
            }
        }
    });
