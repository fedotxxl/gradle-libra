app_common.
    directive('tip', function () {
        return function (scope, element, attrs) {

            element.tipsy({
                gravity:attrs.tipGravity,
                opacity:0.9,
                trigger:'manual',
                className:attrs.tipClass,
                html: true
            });

            attrs.$observe('tip', function (value) {
                if (value) {
                    element.tipsy(true).update({fallback:value}).show();
                } else {
                    element.tipsy(true).hide();
                }
            });
        };
    });