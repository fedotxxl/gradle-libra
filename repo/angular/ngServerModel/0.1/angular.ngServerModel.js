app_common.
    directive('ngServerModel', function ($parse) {
        return {
            'restrict':'A',
            'link':function (scope, element, attrs) {
                $parse(attrs.ngServerModel).assign(scope, attrs.ngServerValue);
            }
        }
    });