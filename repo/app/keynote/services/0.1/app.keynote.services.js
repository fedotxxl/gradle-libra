'use strict';

/* Services */
app.
    value('shared', {}).
    factory('_key', function(utils) {
        var filter = function(key, notes, maxNotesToDisplay) {
            var displayed = [];
            var moreNotesCount = 0;

            var addNote = function(note) {
                if (maxNotesToDisplay <= 0 || displayed.length < maxNotesToDisplay) {
                    displayed.push(note)
                } else {
                    moreNotesCount++
                }
            };

            if (key) {
                var filterWords = utils.splitKey(key);

                _.each(notes, function(note) {
                    var splittedKey = [];
                    var fits = false;
                    var filterIndex = 0,
                        filterWord = filterWords[filterIndex];

                    if (!filterWord) return;

                    _.each(note.splittedKey, function(word, i) {
                        var indexOf = word.toLowerCase().indexOf(filterWord.toLowerCase());

                        //found (from first letter) or (second + first = splitter)
                        if (indexOf != -1 && (indexOf == 0 || (indexOf == 1 && _.contains(utils.splitters, word[0])))) {
                            var replaced = word.substring(0, indexOf) + '<b>' + filterWord + '</b>' + word.substring(indexOf + filterWord.length, word.length);
                            splittedKey.push(replaced);

                            filterIndex++;
                            if (filterIndex >= filterWords.length) {
                                fits = true;
                                return;
                            } else {
                                filterWord = filterWords[filterIndex];
                            }
                        } else {
                            splittedKey.push(word);
                        }
                    });

                    if (fits) {
                        addNote({key: note.key, splittedKey: note.splittedKey, displayedKey: splittedKey.concat()})
                    }
                });
            } else {
                //filter is empty... display all notes
                _.each(notes, function(note) {
                    addNote({key: note.key, splittedKey: note.splittedKey, displayedKey: note.key})
                });
            }

            return {notes: displayed, moreNotesCount: moreNotesCount};
        };

        return {
            filter: filter
        }
    }).
    factory('utils', function(){
        var splitters = ['.', '-', '_'];
        var keyRegExp = /^[a-zA-Z\.\-_]*$/;

        return {
            splitters: splitters,
            splitKey: function(key) {
                var splittedKey = key.split("");
                var splitter = false;
                var words = [], currentWord = '';

                var saveWord = function(word) {
                    if (word) words.push(word);
                };

                _.each(splittedKey, function(val) {
                    if (_.indexOf(splitters, val) != -1) {
                        saveWord(currentWord);
                        currentWord = val;
                        splitter = true
                    } else if (val.toUpperCase() == val) {
                        if (!splitter) {
                            saveWord(currentWord);
                            currentWord = val;
                        } else {
                            currentWord += val;
                        }

                        splitter = false;
                    } else {
                        currentWord += val;
                        splitter = false;
                    }
                });

                if (currentWord) words.push(currentWord);

                return words;
            },
            validateKey: function(key) {
                if (key) {
                    return keyRegExp.test(key);
                } else {
                    return false
                }
            }
        }
    })
