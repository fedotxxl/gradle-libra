app_bg.
    factory('sync', function(db, api, utils, settings, _log, $q, $rootScope, $timeout) {
        var syncInProcess = false;

        var once = function() {
            var deferred = $q.defer();

            if (syncInProcess) {
                //already syncing changes.
                var checkSyncIsCompletedAndResolve = function() {
                    if (!syncInProcess) {
                        deferred.resolve();
                    } else {
                        $timeout(checkSyncIsCompletedAndResolve, 100);
                    }
                };

                //just wait until other sync process will be completed
                checkSyncIsCompletedAndResolve();

                //return promise
                return deferred;
            }

            //start sync process
            syncInProcess = true;

            // sync is enabled... do sync
            $rootScope.$broadcast('keyNote.chrome.bg.sync.started');

            var synced = db.query("sync")[0].date;
            var pushNotes = db.query("notes", function(note) {
                return (note.lastUpdated > synced)
            });

            _log.debug("Sync. Sended: ", pushNotes);

            api.pushNotes(synced, pushNotes).then(function(response) {
                if (response) {
                    var notes = response.data;
                    var now = new Date().getTime();

                    _log.debug("Sync. Recieved: ", notes);

                    _.each(notes, function(note) {
                        if (utils.validateKey(note.key)) {
                            note.lastUpdated = now;
                            db.insertOrUpdate("notes", {key: note.key}, note)
                        }
                    });

                    // save new date
                    db.update("sync", function(sync) { return true }, function(sync) {
                        sync.date = now+1;
                        return sync;
                    });

                    db.commit();

                    $rootScope.$broadcast('keyNote.chrome.bg.sync.completed');

                    //continue promises chain
                    deferred.resolve(true);

                    //sync process is completed
                    syncInProcess = false;

                    _log.debug("Sync process successfully completed");
                } else {
                    //continue promises chain
                    deferred.resolve(false);

                    //sync process is completed
                    syncInProcess = false;

                    _log.debug("Failed to sync changes");
                }
            });

            return deferred.promise;
        };

        var interval = 10*60*1000;

        var eachXMinutes = function() {
            if (settings.isSyncEachXMinutes()) {
                _log.debug("Starting sync each x minutes");

                // sync is enabled... do sync
                once().then(function() {
                    $timeout(eachXMinutes, interval)
                });
            } else {
                // sync is disabled...
                $rootScope.$broadcast('keyNote.chrome.bg.sync.disabled');

                // just repeat check - may be some one will enable it
                $timeout(eachXMinutes, interval)
            }
        };

        return {
            once: once,
            initSyncEachXMinutes: function() {
                $timeout(eachXMinutes, interval)
            }
        }
    }).
    config(function ($httpProvider) {

        var interceptor = function ($q, $injector, $rootScope, _log) {
            var $http, auth; //initialized later because of circular dependency problem

            function success(response) {
                return response;
            }

            function error(response) {
                $rootScope.$broadcast('keyNote.chrome.bg.http.exception');

                if (response.status === 401 && !response.config.data.auth) {
                    $http = $http || $injector.get('$http');
                    auth = auth || $injector.get('auth');

                    var deferred = $q.defer();

                    var success = function (authResponse) {
                        // mark response as processed auth to avoid cycling
                        response.config.data.auth = true;
                        // update token
                        response.config.params.token = auth.getToken();

                        // resend request
                        $http(response.config).then(function (response) {
                            deferred.resolve(response);
                        })
                    };

                    var error = function () {
                        _log.debug('failed to make reauth');
                        deferred.resolve(null);
                    };

                    auth.doAuth(success, error);

                    return deferred.promise;
                }

                // intercept exception
                _log.debug("Exception", response);

                return null
            }

            return function (promise) {
                return promise.then(success, error);
            }

        };

        $httpProvider.responseInterceptors.push(interceptor);
    }).
    run(function (commonService, sync, settings, _log, $timeout) {
        // share sync service
        commonService.add('sync', sync);

        // start sync process
        sync.initSyncEachXMinutes();

        // sync on startup in 10 seconds after startup
        $timeout(function() {
            if (settings.isSyncOnStartup()) {
                _log.debug("Starting sync on startup");
                sync.once();
            }
        }, 10*1000);
    });