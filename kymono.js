/* Init minified.js */
var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;


var conf = {
    // base: 'http://localhost:8000/',
    base: '/id/8099985/',
    name: 'KyMoNo',
    version: 'v0.1.0',
    // css: 'kymono.css',
    css: 'https://cdn.jsdelivr.net/gh/rplnt/kymono@master/kymono.css',
    // userConfig: 'config.json',
    userConfig: 'https://cdn.jsdelivr.net/gh/rplnt/kymono@master/config.json',
    recent: 1000*60*60*24*3
};


var templates = {
    bookmarks: '7269244',
    home: '7269265'
}

var App = {
    conf: null,
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
    },

    onNavigation: function(event) {
        // TODO detect if this back event instead of click in navigation.. somehow?
    },
};


/* INIT */
$(function() {

    /* Load config */
    // App.LoadConf();

    /* get rid of head and body */
    (function takeOver() {
        console.log('Loading ' + conf.name + ' ' + conf.version);
        $('head').fill();
        try {
            clearTimeout(check_mail_timer);
            document.removeEventListener('onmousemove', getMouseXY);
        } catch (e) {
            // whatever
        }

        window.onhashchange = App.onNavigation;

        $('body').fill();
        $('head').add(EE('title', conf.name + ' ' + conf.version));
        $('head').add(EE('link', {'@rel': 'stylesheet', '@type': 'text/css', '@href': conf.css}));

        // has to be a reaction to user request -- add menu entry
        // goFullScreen();
    })();

    /* add main menu */
    var homeBtn = EE('a', {$: 'btn btn-menu', '@title': 'Home', id: 'home-btn'}, 'H');
    homeBtn.onClick(App.open, [App.Home]);

    var bookmarksBtn = EE('a', {$: 'btn btn-menu', '@title': 'Bookmarks', id: 'bkm-btn'}, 'B');
    bookmarksBtn.onClick(App.open, [App.Bookmarks]);

    var mailBtn = EE('a', {$: 'btn btn-menu', '@title': 'Mail', id: 'mail-btn'}, 'M');
    mailBtn.onClick(App.open, [App.Mail]);

    var kBtn = EE('a', {$: 'btn btn-menu', '@title': 'K', id: 'k-btn'}, 'K');
    kBtn.onClick(App.open, [App.K]);

    var menuBtn = EE('a', {$: 'btn btn-menu', '@title': 'Menu'}, '≡');
    menuBtn.onClick(function() {
        $('#dropdown').set('active');
    });

    /* dropdown menu -- much TODO */
    var dropdown = EE('div', {id: 'dropdown'}, [
        EE('a', {$: 'btn dropdown-item'}, 'Somewhere'),
        EE('a', {$: 'btn dropdown-item'}, 'Over The'),
        EE('a', {$: 'btn dropdown-item'}, 'Rainbow')
    ]);

    (function addMenu() {
        $('body').add(EE('ul', {id: 'main-menu'}, [
            EE('li', {$: 'menu-item'}, homeBtn),
            EE('li', {$: 'menu-item'}, bookmarksBtn),
            EE('li', {$: 'menu-item'}, mailBtn),
            EE('li', {$: 'menu-item'}, kBtn),
            EE('ul', {$: 'main-menu-right'}, 
                EE('li', {$: 'menu-item'}, menuBtn)
            )
        ]))
    })();

    $('body').add(EE('div', {$: 'pad'}, '^'));

    $('body').add(dropdown);

    $('body').add(EE('div', {id: 'app'}));

    setTimeout(function() {
        if (!localStorage.getItem('KyMoNo')) {
            App.Settings();
            localStorage.setItem('KyMoNo', conf.version);
        } else {
            $('body').set('$fontSize', App.getOpt('global.fontSize') + 'em');

            var target;
            if (location.hash) {
                target = location.hash;
            } else {
                target = App.getOpt('global.defaultScreen');
            }

            switch (target) {
                case 'H':
                case 'home':
                    $('#home-btn').set('+active');
                    App.Home();
                    break;
                case 'B':
                case '#bookmarks':
                    $('#bkm-btn').set('+active');
                    App.Bookmarks();
                    break;
                case '#settings':
                default:
                    App.Settings();
                    break;
            }
        }
        
    }, 0);
});


/************** SETTINGS **************/
(function(app) {
    app.Settings = function() {
        location.hash = '#settings';

        if (app.conf == null) {
            app.conf = {};

            loadDefaults(function(conf) {
                $('#app').fill();

                /* Iterate over config sections */
                for (var i = 0; i < conf.template.length; i++) {
                    $('#app').add(EE('div', {$: 'cat-header cat'}, conf.template[i].title));

                    app.conf[conf.template[i].name] = {};

                    /* render individual options */
                    for (var n = 0; n < conf.template[i].settings.length; n++) {
                        var opt = conf.template[i].settings[n];
                        $('#app').add(EE('div', opt.description));
                        processOption(conf.template[i].name, opt.name, opt.type, opt.value);
                    }
                }

            });
        }

    }


    app.getOpt = function(key) {
        if (localStorage.getItem(key)) {
            return JSON.parse(localStorage.getItem(key));
        } else {
            return null;
        }
    }


    function processOption(cat, name, type, value) {
        var key = cat + "." + name;

        var current;
        if (localStorage.getItem(key)) {
            current = app.getOpt(key);
        } else {
            if (type == 'enum') {
                localStorage.setItem(key, JSON.stringify(value[0]));
                current = value[0];
            } else {
                localStorage.setItem(key, JSON.stringify(value));
                current = value;
            }
        }

        var elmnt;
        switch (type) {
            case 'int':
            case 'float':
            case 'string':
                elmnt = EE('input', {'type': 'text'}).set('value', current);
                break;
            case 'boolean':
                elmnt = EE('input', {'type': 'checkbox'}).set('checked', current);
                break;
            case 'enum':
                elmnt = EE('select')
                for (var o = 0; o < value.length; o++) {
                    elmnt.add(EE('option', value[o]).set('selected', current == value[o]));
                }
                break;
            default:
                app.err('Invalid settings template');
                break;  // return;
        }

        elmnt.onChange(function(input) {
            localStorage.setItem(key, JSON.stringify(input));
        });

        $('#app').add(elmnt);
    }


    function loadDefaults(callback) {
        loadContent(conf.userConfig, function(response) {
            callback($.parseJSON(response));
        });
    }

})(App);




/**************** HOME ****************/
(function(app) {
    app.Home = function() {
        location.hash = '#home';
        
        loadContent(conf.base + templates.home, function(content) {
            content = HTML(content);
            $('#app').fill();

            /* most populated nodes */
            if (app.getOpt('home.mpnEnabled')) {
                var mpnData = $('mpn', content);
                if (mpnData) {
                    mpn(mpnData);
                }
            }




        });
    }
    mpnBlacklist = [19, 4830026, 3777728, 5898094, 2176597, 3660841, 1522695, 1569351, 
                    7607525, 788016, 7568906, 3579407];
    function mpn(content) {

        $('#app').add(EE('div', {$: 'cat-header cat'}, 'most.populated.nodes'));
        $('#app').add(EE('div', {id: 'mpn'}));

        var maxCnt = null;
        var limitOne = 4;
        $('node', content).per(function(node, i) {
            if (limitOne <= 0) return;

            var nodeName = node.get('innerHTML');
            var nodeId = parseInt(node.get('@node'));

            if (!nodeName || !nodeId) return;

            if (nodeId < 30 || nodeName.toLowerCase().startsWith('bookm') || mpnBlacklist.indexOf(nodeId) > -1) {
                return;
            }

            var nodeNameShort = nodeName.trim().trunc(20).replace(/ /g, '\u00a0');
            var cnt = parseInt(node.get('@count'));
            var nodeSize = (cnt>5 ?5.5:cnt) * 0.43;
            console.log(cnt, nodeSize);
            if (cnt <= 1) limitOne--;

            var a = EE('a', {$: 'node-link mpn-link', '@data-id': nodeId, '@href': '/id/' + nodeId, '@title': nodeName.trim() + ' ('+cnt+')'}, nodeNameShort);
            $('#mpn').add(EE('span', {'$fontSize': nodeSize + 'em'}, ['(', a, ') ']));
        });
    }
})(App);


/************** BOOKMARKS **************/
(function(app) {
    // TODO rewrite to use config in a sane way
    var timeRangeIndex = {'24H': 0, '1W': 1, '1M': 2, '23Y': 3}[app.getOpt('bookmarks.defaultTimespan')];
    var timeRanges = [['24H', 24*60], ['1W', 7*24*60], ['1M', 30*24*60], ['23Y', 23*365*24*60]];

    /* main entry point */
    app.Bookmarks = function() {
        location.hash = '#bookmarks';

        loadContent(conf.base + templates.bookmarks, function(content) {
            content = HTML(content);
            var names = [];
            var bookId = 0;

            $('#app').fill();

            /* boomkmarks menu */
            var filterAttrs = {id: 'book-filter', $: 'book-filter', '@type': 'search', '@placeholder': 'Filter Bookmarks'};
            var filter = EE('input', filterAttrs);
            filter.onChange(onInputChange);
            filter.on('|keypress', submitSearch);
            $('#app').add(filter);

            
            $('#app').add(EE('div', {$: 'filter-menu'}));

            /* show only bookmarks with NEW */
            $('.filter-menu').add('Show');
            var unreadBtn = EE('span', {$: 'btn btn-filter'}, newOnly?'NEW':'ALL');
            unreadBtn.onClick(toggleNewFilter);
            $('.filter-menu').add(unreadBtn);

            $('.filter-menu').add('visited in');
            var recentButton;
            recentButton = EE('span', {$: 'btn btn-filter'}, timeRanges[timeRangeIndex][0]);
            recentButton.onClick(updateFilter, [1]);
             $('.filter-menu').add(recentButton);

            /* show/hide all categories */
            // var showAllBtn = EE('span', {$: 'btn btn-filter btn-right'}, 'X');
            // showAllBtn.onClick(function(e) {
            //     if (this.set('active').is('.active')) {
            //         this.set('innerHTML', '-');
            //         $('.bookmark').set('-hidden');
            //     } else {
            //         this.set('innerHTML', '+');
            //         $('.bookmark').set('+hidden');
            //     }
            // })
            // $('.filter-menu').add(showAllBtn);

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
                    var nodeId = bkm.get('@node');
                    var bookName = EE('a', {$: 'book-name node-link', '@data-id': nodeId, '@href': '/id/' + nodeId}, bkm.get('innerHTML').trim());
                    /* TODO move to global handler */
                    bookName.onClick(app.openNode, [nodeId]);

                    var bookUnread = null;
                    var newDescendants = bkm.get('@desc')=='yes'?'+':''
                    var unread = bkm.get('@unread');
                    if (unread != 0) {
                        bookUnread = EE('span', {$: 'book-unread'}, '(' + unread + newDescendants + ')');
                    } else if (newDescendants == '+') {
                        bookUnread = EE('span', ' ' + newDescendants);
                    }

                    var visited = dateDiffMins(bkm.get('@visit'));
                    bookmarks.add(EE('div', {
                            id: 'book-' + bookId,
                            $: 'bookmark',
                            '@data-unread': bkm.get('@unread'),
                            '@data-visit': Math.floor(visited|0),
                            '@data-descdnt': newDescendants
                        }, [
                            bookName,
                            bookUnread
                        ]
                    ));
                    names.push([bkm.get('innerHTML'), bookId])

                    bookId++;
                });

                $('#app').add(bookmarks);

            });

            updateFilter(0);

            if (app.getOpt('bookmarks.focusFilter')) {
                $$('#book-filter').focus();
            }

            app.buildSearchIndex(names)
        });
    }

    function updateFilter(changeRange) {
        timeRangeIndex = (timeRangeIndex + changeRange) % timeRanges.length;

        $('.bookmark', '#app').per(function(elmnt, index) {
            if (elmnt.get('%visit') < timeRanges[timeRangeIndex][1]) {
                if (!newOnly || (newOnly && (elmnt.get('%unread') > 0 || (app.getOpt('bookmarks.includeDescdnt') && elmnt.get('%descdnt') == '+')))) {
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
                app.openNode($('a', $('.bookmark').not('.hidden')).get('%id'));
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
        location.hash = '#mail';
        app.err('Not implemented');
    }
})(App);


/************** K **************/
(function(app) {
    app.K = function() {
        $('#app').fill();
        location.hash = '#k';
        app.err('Not implemented');
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
    if (!d) return 0;
    var reDate = /(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/
    var m = d.match(reDate);

    if (m) {
        lastVisit = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
        return (((new Date()) - lastVisit) / (60 * 1000));
    }

    return 0;
}


// this is crap
// function goFullScreen() {
//     var elem = document.body;
//     if (elem.requestFullscreen) {
//       elem.requestFullscreen();
//     } else if (elem.msRequestFullscreen) {
//       elem.msRequestFullscreen();
//     } else if (elem.mozRequestFullScreen) {
//       elem.mozRequestFullScreen();
//     } else if (elem.webkitRequestFullscreen) {
//       elem.webkitRequestFullscreen();
//     }
// }



/************** NODES ***************/
(function(app) {
    app.openNode = function(node) {
        console.log('Opening ' + node);
        window.open('https://kyberia.sk/id/' + node, '_blank');
    }
})(App);


/* todo -> utils */
function loadContent(uri, callback) {
    App.loading();

    console.log('Fetching (' + uri + ')');

    $.request('get', uri)
    .then(
        function success(response) {
            console.log("Success");
            callback(response);
        },
        function error(status, statusText, responseText) {
            App.err(uri + ' ' + status);
        }
    );
}


String.prototype.trunc = String.prototype.trunc ||
    function(n){
        return (this.length > n) ? this.substr(0, n-1)+'...' : this;
    };

