app.
    factory('Note', function(db, utils, settings, sync, _log, $q) {

        //
        var Resource = function(data) {
            angular.extend(this, data);
        };

        // a static method to retrieve Resource by ID
        Resource.get = function(id) {
            _log.debug("Loading note with id " + id);

            var dbData = db.query("notes", {key: id})[0];
            if (dbData) {
                return new Resource(dbData);
            } else {
                return new Resource({key: id})
            }
        };

        // a static method to retrieve a list of all resources
        Resource.list = function() {
            var resources = [];
            var notes = db.query("notes", function(note) {
                return !note.deleted;
            });

            notes = _.sortBy(notes, function(note) { return note.key });

            _.each(notes, function(resource) {
                resources.push(new Resource(resource))
            });

            _log.debug("Loaded list of notes", resources);

            return resources;
        };

        // an instance method save
        Resource.prototype.save = function() {
            var that = this;
            var deferred = $q.defer();

            if (!utils.validateKey(this.key)) {
                //invalid key... do nothing
                deferred.reject();
                return deferred.promise;
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

            //if sync on change is enabled - sync with server
            if (settings.isSyncOnChange()) {
                _log.debug("Starting sync on change (save)");
                sync.once();
            }

            return deferred.promise;
        };

        // an instance method to delete a resource
        Resource.prototype.delete = function() {
            var that = this;
            var deferred = $q.defer();

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

            return deferred.promise;
        };

        return Resource;
    });