app.
    factory('db', function (_log, $q) {
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
        };

        var db = new localStorageDB("key_notes_storage", localStorage);
        afterInit(db);

        return {
            then: function(callback) {
                callback(db)
            }
        }
    });