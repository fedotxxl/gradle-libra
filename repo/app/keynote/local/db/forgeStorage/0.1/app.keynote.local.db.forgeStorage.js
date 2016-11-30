app.
    factory('db', function (_log, $q) {
        var deferred = $q.defer(); //this method should return promise

        var afterInit = function (db) {
            _log.debug("Loading data from db " + db);

            if (!db.tableExists("sync")) {
                db.createTable("sync", ["date"]);
                db.commit();

                db.insert("sync", {date:1});
                db.commit();
            }

            if (!db.tableExists("notes")) {
                db.createTable("notes", ["key", "content", "lastUpdated", "deleted", "splittedKey"], ["key"]);
                db.commit();
            }

            db.insertOrUpdate = function (collection, selection, object) {
                db.deleteRows(collection, selection);
                db.insert(collection, object);
            };

            deferred.resolve(db);
        };

        new forgeStorageDB("key_notes_storage", afterInit);
        return deferred.promise;
    });