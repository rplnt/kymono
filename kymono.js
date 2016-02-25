/* Init minified.js */
var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;

var conf = {
    base: '/id/8099985/',
    // base: 'http://localhost:8000/',
    name: 'KyMoNo',
    version: 'v0.0.1',
    css: 'https://cdn.rawgit.com/rplnt/kymono/master/kymono.css',
    recent: 1000*60*60*24*3
};

var templates = {
    bookmarks: '7269244'
}

var App = {
    loading: function() { 
        $('#app').fill(EE('div', {$: 'sp-circle'})); 
    },
    open: function(call) {
        $('a', '.menu-item').set('-active');
        this.set('+active');
        call();
    },

    /* Display Error */
    err: function(msg) {
        console.log('Error ' + msg);
    }


};


/* INIT */
$(function() {

    /* get rid of head and body */
    (function takeOver() {
        console.log('Loading ' + conf.name + ' ' + conf.version);
        $('head').fill();
        try {
            clearTimeout(check_mail_timer);
        } catch (e) {
            // whatever
        }
        $('body').fill();
        $('head').add(EE('title', conf.name + ' ' + conf.version));
        $('head').add(EE('link', {'@rel': 'stylesheet', '@type': 'text/css', '@href': conf.css}));
    })();

    /* add main menu */

    var homeBtn = EE('a', {$: 'btn btn-menu active', '@title': 'Home'}, 'H');
    homeBtn.onClick(App.open, [App.Home]);

    var bookmarksBtn = EE('a', {$: 'btn btn-menu', '@title': 'Bookmarks'}, 'B');
    bookmarksBtn.onClick(App.open, [App.Bookmarks]);

    var mailBtn = EE('a', {$: 'btn btn-menu', '@title': 'Mail'}, 'M');
    mailBtn.onClick(App.open, [App.Mail]);

    var kBtn = EE('a', {$: 'btn btn-menu', '@title': 'K'}, 'K');
    kBtn.onClick(App.open, [App.K]);

    (function addMenu() {
        $('body').add(EE('ul', {id: 'main-menu'}, [
            EE('li', {$: 'menu-item'}, homeBtn),
            EE('li', {$: 'menu-item'}, bookmarksBtn),
            EE('li', {$: 'menu-item'}, mailBtn),
            EE('li', {$: 'menu-item'}, kBtn),
            EE('ul', {$: 'main-menu-right'}, 
                EE('li', {$: 'menu-item'}, EE('a', {$: 'btn btn-menu', '@title': 'Whatever'}, 'W'))
            )
        ]))
    })();

    $('body').add(EE('div', {id: 'app'}));

    setTimeout(function() {
        App.Home();
    }, 0);
});



/**************** HOME ****************/
(function(app) {
    app.Home = function() {
        $('#app').fill();
        app.err("Not implemented");
    }
})(App);


/************** BOOKMARKS **************/
(function(app) {

    var timeRangeIndex = 1;
    var timeRanges = [['24H', 24*60], ['1W', 7*24*60], ['1M', 30*24*60], ['23Y', 23*365*24*60]];

    /* main entry point */
    app.Bookmarks = function() {

        loadContent(templates.bookmarks, function(content) {
            var names = [];
            var bookId = 0;

            $('#app').fill();

            /* boomkmarks menu */
            var filter = EE('input', {id: 'book-filter', $: 'book-filter', '@type': 'search', '@placeholder': 'Filter Bookmarks'});
            filter.onChange(onInputChange);
            filter.on('|keypress', submitSearch);
            $('#app').add(filter);

            
            $('#app').add(EE('div', {$: 'filter-menu'}));

            /* show only bookmarks with NEW */
            $('.filter-menu').add('Show');
            var unreadBtn = EE('span', {$: 'btn btn-filter'}, newOnly?'NEW':'ALL');
            unreadBtn.onClick(toggleNewFilter);
            $('.filter-menu').add(unreadBtn);

            $('.filter-menu').add('visited in last');
            var recentButton;
            recentButton = EE('span', {$: 'btn btn-filter'}, timeRanges[timeRangeIndex][0]);
            recentButton.onClick(updateFilter, [1]);
             $('.filter-menu').add(recentButton);

            /* show/hide all categories */
            var showAllBtn = EE('span', {$: 'btn btn-filter right'}, '+');
            showAllBtn.onClick(function(e) {
                if (this.set('active').is('.active')) {
                    this.set('innerHTML', '-');
                    $('.bookmark').set('-hidden');
                } else {
                    this.set('innerHTML', '+');
                    $('.bookmark').set('+hidden');
                }
            })
            $('.filter-menu').add(showAllBtn);

            /* bookmark categories */
            $('book-cat', content).per(function(cat, i) {
                if ($('book-mark', cat).length == 0) return;

                /* category title */
                var catTitle = EE('div', {$: 'cat-header'}, [
                    EE('span', {$: 'cat name'}, cat.get('@name')||'...'),
                    cat.get('@unread')==0?null:EE('span', {$: 'cat unread'}, cat.get('@unread'))
                ]);
                catTitle.onClick(toggleBookCategory);

                /* individual bookmarks */
                var bookmarks = EE('div', {$: 'book-cat'}, catTitle);
                $('book-mark', cat).per(function(bkm, i) {
                    var bookName = EE('a', {$: 'book name'}, bkm.get('innerHTML').trim());
                    bookName.onClick(app.openNode, [bkm.get('@node')]);

                    var bookUnread = null;
                    var unread = bkm.get('@unread');
                    if (unread != 0) {
                        bookUnread = EE('span', {$: 'book unread'}, unread);
                    }

                    var visited = dateDiffMins(bkm.get('@visit'));
                    bookmarks.add(EE('div', {
                            id: 'book-' + bookId,
                            $: 'bookmark',
                            '@data-id': bkm.get('@node'),
                            '@data-unread': bkm.get('@unread'),
                            '@data-visit': Math.floor(visited|0)
                        }, [
                            bookName,
                            bookUnread,
                            (bkm.get('@desc')=='yes'?' ...':'')
                        ]
                    ));
                    names.push([bkm.get('innerHTML'), bookId])

                    bookId++;
                });

                $('#app').add(bookmarks);

            });

            updateFilter(0);

            /* possibly disable on mobile */
            $$('#book-filter').focus();

            app.buildSearchIndex(names)
        });
    }

    function updateFilter(changeRange) {
        timeRangeIndex = (timeRangeIndex + changeRange) % timeRanges.length;

        $('.bookmark', '#app').per(function(elmnt, index) {
            if (elmnt.get('%visit') < timeRanges[timeRangeIndex][1]) {
                if (!newOnly || (newOnly && elmnt.get('%unread') > 0)) {
                    elmnt.set('-hidden');
                } else {
                    elmnt.set('+hidden');
                }
            } else {
                elmnt.set('+hidden');
            }
        })

        if (changeRange) {
            this.set('innerHTML', timeRanges[timeRangeIndex][0]);
        }
    }

    var newOnly = true;
    function toggleNewFilter() {
        if (!newOnly) {
            newOnly = true;
            this.set('innerHTML', 'NEW');
            updateFilter(0);
        } else {
            newOnly = false;
            this.set('innerHTML', 'ALL');
            updateFilter(0);
        }
    }


    function toggleBookCategory() {
        if ($('.bookmark', this.up()).is('.hidden')) {
            $('.bookmark', this.up()).per( function(elmnt, index) {
                elmnt.set('-hidden')
            });  
        } else {
            $('.bookmark', this.up()).per( function(elmnt, index) {
                elmnt.set('+hidden')
            });
        }
    }

    function filterBookmakrs(bookIds) {
        $('.bookmark').set('+hidden');
        bookIds.map( function(bookId) {
            $('#' + bookId).set('-hidden');
        })
    }


    function submitSearch(e) {
        if (e.keyCode == 13) {
            if ($('.bookmark').not('.hidden').length == 1) {
                openNode($('.bookmark').not('.hidden').get('%id'));
            }
        }
    }


    function onInputChange(input) {
        var ids = app.searchIndex(input);

        if (ids == null) {
            if (input.length > 0) {
                $('.bookmark').set('-hidden');
            }
            return;
        }

        var bookIds = ids.map(function(i) { return 'book-' + i; });
        filterBookmakrs(bookIds);

        // todo: show that node "form" can be submitted?
        //console.log($('.bookmark').not('.hidden').length == 1);
    }

})(App);




/************** MAIL **************/
(function(app) {
    app.Mail = function() {
        $('#app').fill();
        app.err("Not implemented");
    }
})(App);


/************** K **************/
(function(app) {
    app.K = function() {
        $('#app').fill();
        app.err("Not implemented");
    }
})(App);




/***** Bookmarks SEARCH *****/
(function(glob) {

    var searchData = {index: {}, words: {}};
    var indexed = false;

    // data = [[title, id], [title, id], ...]
    glob.buildSearchIndex = function(data) {
        if (indexed) return;
        indexed = true;

        var chuje = {'ľ': 'l', 'š': 's', 'č': 'c', 'ť': 't', 'ž': 'z', 'ý': 'y', 'á': 'a', 'í': 'i', 'é': 'e', 'ú': 'u', 'ä': 'a', 'ň': 'n', 'ô': 'a', 'ř': 'r'};
        var reChuje = /[ľščťžýáíéúäňôř]/g;
        var reSplit = /[\-\_\.\,\\\/\;\:\|\\\+\=\*\&\'\"\@\$\^]|(&\w+;)/g;
        var reRemove = /[0-9]+|[\(\)\[\]\<\>\{\}\#\!\?\%]/g;

        for (var i=0; i < data.length; i++) {
            var words = data[i][0]
                            .toLowerCase()
                            .replace(reChuje, function(a) { return chuje[a]||a; })
                            .replace(reSplit, ' ')
                            .replace(reRemove, '')
                            .split(/\s+/);

            for (var w = 0; w < words.length; w++) {
                if (!words[w]) continue;
                if (words[w].length < 3) continue;

                var prefix = words[w].substring(0, 2);

                if (!(prefix in searchData.index)) {
                    searchData.index[prefix] = [];
                }

                if (searchData.index[prefix].indexOf(words[w]) == -1) {
                    searchData.index[prefix].push(words[w]);
                }

                if (!(words[w] in searchData.words)) {
                    searchData.words[words[w]] = [];
                }

                searchData.words[words[w]].push(data[i][1]);   
            }
        }
    }


    glob.searchIndex = function(input) {
        if (!input || input.length < 2) return null;

        words = input.toLowerCase().split(/\s+/);

        var ids = new PrimitiveSet();
        for (var w=0; w < words.length; w++) {
            if (!words[w] || words[w].length < 2) continue;

            var prefix = words[w].substring(0, 2);

            var wordIds = []
            if (prefix in searchData.index) {
                for (var c = 0; c < searchData.index[prefix].length; c++) {
                    if (!searchData.index[prefix][c].startsWith(words[w])) continue;
                    wordIds = wordIds.concat(searchData.words[searchData.index[prefix][c]]);
                }        
            }
            if (w == 0) {
                /* fill set */
                ids.addList(wordIds);
            } else {
                /* refine results */
                ids.intersect(wordIds);
            }

        }

        return ids.get();
    }

    /* Primitive SET object */
    var PrimitiveSet = function() {
        this.itemsLst = [];
        this.itemsObj = {};
    }

    PrimitiveSet.prototype.addItem = function(item) {
        if (item in this.itemsObj) return false;
        this.itemsObj[item] = true;
        return this.itemsLst.push(item) > 0;
    };

    PrimitiveSet.prototype.addList = function(items) {
        return (items.map(this.addItem, this)).reduce(function(p, c) { return p && c; }, true);
    };

    PrimitiveSet.prototype.get = function() {
        return this.itemsLst;
    }

    PrimitiveSet.prototype.intersect = function(items) {
        newItemsLst = [];
        newItemsObj = {};

        for (var i=0; i<items.length; i++) {
            if (items[i] in this.itemsObj && !(items[i] in newItemsObj)) {
                newItemsObj[items[i]] = true;
                newItemsLst.push(items[i]);
            }
        }

        this.itemsLst = newItemsLst;
        this.itemsObj = newItemsObj;
    }

})(App);


/* Get diff to current date */
function dateDiffMins(d) {
    var reDate = /(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/
    var m = d.match(reDate);

    if (m) {
        lastVisit = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
        return (((new Date()) - lastVisit) / (60 * 1000));
    }

    return Infinity;
}



/************** NODES ***************/
(function(app) {
    app.openNode = function(node) {
        console.log(node);
    }
})(App);





/* todo */
function loadContent(template, callback) {
    App.loading();
    var uri = conf.base + template;

    console.log('Fetching (' + uri + ')');

    $.request('get', uri)
    .then(
        function success(response) {
            callback(HTML(response));
        },
        function error(status, statusText, responseText) {
            App.err(uri + ' ' + status);
        }
    );   
}








