app_common.
    //adds method to refresh model for field marked as autoFillableField
    //https://groups.google.com/forum/#!msg/angular/8TmwFaSL-AY/HerEI2lnub0J
    //https://github.com/angular/angular.js/issues/1460
    directive('autoFillableField', function () {

        var fields = [];

        return {
            'restrict':'A',
            'controller':function ($scope, $parse) {
                var that = this;
                that.addField = function(field, attrs) {
                    fields.push({field: field, attrs: attrs});
                };

                $scope.updateModelFromAutoFillableFields = function() {
                    angular.forEach(fields, function(field) {
                        $parse(field.attrs.ngModel).assign($scope, field.field.val());
                    })
                }
            },
            'link':function (scope, element, attrs, ctrl) {
                ctrl.addField(element, attrs);
            }
        }
    });