app_common.
    factory('c_other', function() {
        var getWindowWidth = function() {
            return $(window).width()
        };

        var isMobile = function() {
            return true; //todo
        };

        return {
            getWindowWidth: getWindowWidth,
            isMobile: isMobile
        }
    });