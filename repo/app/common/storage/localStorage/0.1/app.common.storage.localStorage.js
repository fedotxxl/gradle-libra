app_common.
    factory('storage', function($q) {
        var set = function(key, obj) {
            var deferred = $q.defer();

            localStorage.setItem(key, JSON.stringify(obj));
            deferred.resolve();

            return deferred.promise;
        };

        var get = function(key) {
            var deferred = $q.defer();

            var obj = JSON.parse(localStorage.getItem(key));
            deferred.resolve(obj);

            return deferred.promise;
        };

        return {
            set: set,
            get: get
        }
    });