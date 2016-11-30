app.
    factory('auth', function($http, settings, c_router, _log, applicationId) {
        var data = {token: ''};

        var invalidateToken = function() {
            data.token = '';
        };

        var doAuth = function(success, error) {
            var username = settings.getUsername();
            var password = settings.getPassword();

            var err = function() {
                _log.debug("Failed to load access token for user " + username, arguments);
                error(arguments);
            };

            if (!username) {
                _log.debug("Can't get access token because username is null");
                error();
            } else {
                _log.debug("Loading access token for user " + username);

                $http.post(c_router.auth + '?username=' + username + '&password=' + password + '&applicationId=' + applicationId, {auth: true}).then(function(authResponse) {
                    if (!authResponse) {
                        // I don't know why it's happening
                        _log.debug("Empty auth response - exception");
                        error();
                    } else {
                        _log.debug("Successfully received access token for user " + username);

                        // save token
                        data.token = authResponse.data;

                        // process request
                        success(authResponse);
                    }
                }, err);
            }
        };

        var getToken = function () {
            return data.token
        };

        var hasToken = function() {
            return (data.token) ? true : false
        };

        return {
            hasToken : hasToken,
            getToken: getToken,
            doAuth:doAuth,
            invalidateToken: invalidateToken
        }
    }).
    factory('api', function($http, $q, c_router, auth, _log) {
        var pushNotes = function(synced, notes) {
            var deferred = $q.defer();

            var doPushNotes = function() {
                var now = new Date().getTime();

                // let's fix fucking optimizations
                // also let's set correct lastUpdatedFromNow field
                _.each(notes, function(note) {
                    if (!note.content) note.content = '';
                    if (!note.deleted) note.deleted = false;
                    note.lastUpdatedFromNow = now - note.lastUpdated;
                });

                _log.debug("Pushing notes to the server", notes);

                var success = function(response) {
                    deferred.resolve(response);
                };

                var error = function(response) {
                    deferred.resolve(false);
                };

                // send request
                $http.post(c_router.sync, {synced:synced, notes:notes}, {params:{token:auth.getToken()}}).then(success, error);
            };

            if (!auth.hasToken()) {
                //first we need to authenticate user
                var success = function () {
                    doPushNotes()
                };

                var error = function () {
                    _log.debug('failed to authenticate user');
                    deferred.resolve(null);
                };

                auth.doAuth(success, error);
            } else {
                //we already have token... just push notes
                doPushNotes();
            }

            return deferred.promise;
        };

        return {
            pushNotes: pushNotes
        }
    }).
    factory('sync', function(db, api, auth, utils, settings, _log, $q, $rootScope, $timeout) {
        var syncInProcess = false;
        var syncStack = [];

        var once = function() {
            _log.debug("Starting sync process");

            var deferred = $q.defer();

            if (syncInProcess) {
                _log.debug("Sync already in process... collecting sync request");

                //already syncing changes.
                syncStack.push(deferred);

                //return promise
                return deferred.promise;
            }

            //start sync process
            syncInProcess = true;

            // sync is enabled... do sync
            $rootScope.$broadcast('keyNote.chrome.bg.sync.started');

            db.then(function(db) {
                var synced = db.query("sync")[0].date;
                var pushNotes = db.query("notes", function(note) {
                    return (note.lastUpdated > synced)
                });

                _log.debug("Sync. Sended: ", pushNotes);

                api.pushNotes(synced, pushNotes).then(function(response) {
                    var result = false;

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
                        result = true;
                    }

                    //resolve all promises
                    deferred.resolve(result);
                    _.each(syncStack, function(d) {
                        d.resolve(result);
                    });

                    //sync process is completed
                    syncStack = []; //reset stack
                    syncInProcess = false;

                    if (result) {
                        _log.debug("Sync process successfully completed");
                    } else {
                        _log.debug("Failed to sync changes");
                    }
                });
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

        var markToSyncAllData = function() {
            _log.debug("Marking to resync all data");

            db.then(function(db) {
                db.update("sync", function(sync) { return true }, function(sync) {
                    sync.date = 1;
                    return sync;
                });
            });
        };

        var unlinkAccount = function() {
            auth.invalidateToken();
            markToSyncAllData();
        };

        return {
            once: once,
            markToSyncAllData: markToSyncAllData,
            unlinkAccount: unlinkAccount,
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
                    _log.debug("Intercepting error credentials response (401)", response);

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
                } else {
                    // intercept exception
                    _log.debug("Exception", response);

                    return null
                }
            }

            return function (promise) {
                return promise.then(success, error);
            }

        };

        $httpProvider.responseInterceptors.push(interceptor);
    }).
    run(function (sync, settings, _log) {
        settings.run().then(function() {
            // start sync process
            sync.initSyncEachXMinutes();

            // sync on startup
            if (settings.isSyncOnStartup()) {
                _log.debug("Starting sync on startup");
                sync.once();
            }
        });
    });