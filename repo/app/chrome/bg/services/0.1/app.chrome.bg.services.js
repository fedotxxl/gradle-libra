app_bg.
    factory('commonService', function() {
        window.common = window.common || {};

        return {
            add: function(property, value) {
                common[property] = value;
            }
        }
    }).
    factory('chromeStorage', function() {
        var set, get;

        if (chrome && chrome.storage) {
            set = function(items, callback) { chrome.storage.sync.set(items, callback) };
            get = function(selector, callback) { chrome.storage.sync.get(selector, callback) };
        } else {
            set = function() { };
            get = function() { };
        }

        return {
            get:get,
            set:set
        };
    }).
    factory('settings', function(chromeStorage, $q, $timeout) {
        var runPromise = null;
        var syncSettings = {};

        var getSyncSettings = function() {
            return _.extend({}, syncSettings); //don't return original object
        };

        var setSyncSettings = function(s) {
            chromeStorage.set({'syncSettings': s});
            syncSettings = s;
        };

        var isSyncEnabled = function() {
            return syncSettings.sync;
        };

        var isSyncOnChange = function() {
            return (syncSettings.sync && syncSettings.syncOnChange) ? true : false;
        };

        var isSyncOnStartup = function() {
            return (syncSettings.sync && syncSettings.syncOnStartup) ? true : false;
        };

        var isSyncEachXMinutes = function() {
            return (syncSettings.sync && syncSettings.syncEachXMinutes) ? true : false;
        };

        var getUsername = function() {
            return syncSettings.login
        };

        var getPassword = function() {
            return syncSettings.password
        };

        //this function loads data from storage
        var get = function() {
            var deferred = $q.defer(); //this method should return promise

            chromeStorage.get('syncSettings', function(obj) {
                if (obj.syncSettings) {
                    syncSettings = obj.syncSettings;
                }

                //out of angular scope. $q doesn't work without $timeout or $apply =(
                $timeout(deferred.resolve, 0);
            });

            return deferred.promise;
        };

        //load properties on startup... runs only once
        var run = function() {
            runPromise = (runPromise) ? runPromise : get();
            return runPromise;
        };

        return {
            getSyncSettings: getSyncSettings,
            setSyncSettings: setSyncSettings,
            isSyncEnabled : isSyncEnabled,
            isSyncOnChange: isSyncOnChange,
            isSyncOnStartup: isSyncOnStartup,
            isSyncEachXMinutes: isSyncEachXMinutes,
            getUsername: getUsername,
            getPassword: getPassword,
            get: get,
            run: run
        };
    }).
    run(function(commonService, settings, auth, sync, db) {
        // share settings service
        commonService.add('settings', settings);

        // share auth module
        commonService.add('auth', auth);

        // share sync module
        commonService.add('sync', sync);

        //shared db with ui code
        db.then(function(db) {
            commonService.add('db', db);
        });
    });