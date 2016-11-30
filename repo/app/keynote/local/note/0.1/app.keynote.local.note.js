app.
    factory('Note', function(db, utils, settings, sync, _log, $q) {

        //
        var Resource = function(data) {
            angular.extend(this, data);
        };

        // a static method to retrieve Resource by ID
        Resource.get = function(id, callback) {
            _log.debug("Loading note with id " + id);

            var deferred = $q.defer(); //this method should return promise

            db.then(function(db) {
                var dbData = db.query("notes", {key: id})[0];
                var answer = (dbData) ? new Resource(dbData) : new Resource({key: id});

                deferred.resolve(answer);
                if (callback) callback(answer); //promises sometimes doesn't work (object from background page - Chrome plugin)
            });

            return deferred.promise;
        };

        // a static method to retrieve a list of all resources
        Resource.list = function(callback) {
            var deferred = $q.defer(); //this method should return promise

            db.then(function(db) {
                var resources = [];
                var notes;

                notes = db.query("notes", function(note) { return !note.deleted; });
                notes = _.sortBy(notes, function(note) { return note.key });

                _.each(notes, function(resource) {
                    resources.push(new Resource(resource))
                });

                _log.debug("Loaded list of notes");

                //resolve promise
                deferred.resolve(resources);
                if (callback) callback(resources);
            });

            return deferred.promise;
        };

        // an instance method save
        Resource.prototype.save = function(callback) {
            var that = this;
            var deferred = $q.defer();

            db.then(function(db) {
                if (!utils.validateKey(that.key)) {
                    //invalid key... do nothing
                    deferred.reject();
                    return;
                }

                var insert = (!that.lastUpdated);

                that.lastUpdated = new Date().getTime();
                that.deleted = false;

                if (insert) {
                    //additional calculations
                    that.splittedKey = utils.splitKey(that.key);

                    _log.debug("Creating new note", that);

                    db.insert("notes", that);
                } else {
                    _log.debug("Updating note", that);

                    //update
                    db.update("notes", {key: that.key}, function(note) {
                        angular.extend(note, that);

                        return note;
                    });
                }

                db.commit();

                //resolve promise
                deferred.resolve();
                if (callback) callback();

                //if sync on change is enabled - sync with server
                if (settings.isSyncOnChange()) {
                    _log.debug("Starting sync on change (save)");
                    sync.once();
                }
            });

            return deferred.promise;
        };

        // an instance method to delete a resource
        Resource.prototype.remove = function(callback) {
            var that = this;
            var deferred = $q.defer();

            db.then(function(db) {
                that.content = '';
                that.lastUpdated = new Date().getTime();
                that.deleted = true;

                _log.debug("Removing note", that);

                db.update("notes", {key: that.key}, function(note) {
                    _.extend(note, that);

                    return note;
                });

                db.commit();

                //if sync on change is enabled - sync with server
                if (settings.isSyncOnChange()) {
                    _log.debug("Starting sync on change (delete)");
                    sync.once();
                }

                //resolve promise
                deferred.resolve();
                if (callback) callback();
            });

            return deferred.promise;
        };

        // a static method to remove all notes from storage
        Resource.unlinkAllNotes = function() {
            var deferred = $q.defer(); //this method should return promise

            db.then(function(db) {
                var i = 0;

                db.deleteRows("notes", function(row) {
                    i++;
                    return true;
                });

                db.commit(); // commit the deletions to localStorage

                _log.debug("All notes (" + i + ") were unlink (deleted from local storage)");

                //resolve promise
                deferred.resolve();
            });

            return deferred.promise;
        };

        return Resource;
    });
