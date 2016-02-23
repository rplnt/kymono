/* Init minified.js */
var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;

var conf = {
    name: 'KyMoNo',
    version: 'v0.0.1',
    css: 'kymono.css',
    recent: 1000*60*60*24*3
};

var templates = {
    bookmarks: '7269244'
}


$(function() {
    takeOver();
    addMenu();
    $('body').add(EE('div', {id: 'app'}));
    // openHome();

    loading();
    setTimeout(function() {
        openBookmarks();
    }, 0);
});


function loading() {
    $('#app').fill(EE('div', {$: 'sp-circle'}));
}


function openHome() {

}



// Bookmarks = function() {

// }


function openBookmarks() {
    loadContent(function(content) {
        var names = [];
        var bookId = 0;

        $('#app').fill();

        /* boomkmarks menu */
        var filter = EE('input', {$: 'book-filter', '@type': 'search', '@placeholder': 'Filter Bookmarks'});
        filter.onChange(onInputChange);
        filter.on('|keypress', submitSearch);
        $('#app').add(filter);

        
        $('#app').add(EE('div', {$: 'filter-menu'}));

        /* show only bookmarks with NEW */
        $('.filter-menu').add('Filters: ');
        var unreadBtn = EE('span', {$: 'btn btn-filter active'}, 'NEW');
        unreadBtn.onClick(filterNew);
        $('.filter-menu').add(unreadBtn);

        $('.filter-menu').add('|');
        var recentButton;
        recentButton = EE('span', {$: 'btn btn-filter btn-recent'}, '24H');
        recentButton.onClick(filterRecent, [24]);
         $('.filter-menu').add(recentButton);
        recentButton = EE('span', {$: 'btn btn-filter btn-recent'}, '72H');
        recentButton.onClick(filterRecent, [24*7]);
        $('.filter-menu').add(recentButton);
        recentButton = EE('span', {$: 'btn btn-filter btn-recent active'}, '1W');
        recentButton.onClick(filterRecent, [24*7]);
        $('.filter-menu').add(recentButton);
        recentButton = EE('span', {$: 'btn btn-filter btn-recent'}, '1M');
        recentButton.onClick(filterRecent, [24*7]);
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
                var bookUnread = null;
                bookName.onClick(openNode, [bkm.get('@node')]);
                var unread = bkm.get('@unread');
                if (unread != 0) {
                    bookUnread = EE('span', {$: 'book unread'}, unread);
                }

                var visited = dateDiffMins(bkm.get('@visit'));
                var hide = ((visited < 7*24*60) && bookUnread != null)?'':' hidden';
                bookmarks.add(EE('div', {
                        id: 'book-' + bookId,
                        $: 'bookmark' + hide,
                        '@data-id': bkm.get('@node'),
                        '@data-unread': bkm.get('@unread'),
                        '@data-visit': Math.floor(visited)
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

        if (searchData == null) {
            buildSearchIndex(names)
        }
    });
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


function filterNew(e) {
    if (this.set('active').is('.active')) {
        $('.bookmark').per(function(elmnt, index) {
            if (elmnt.get('%unread') > 0) {
                elmnt.set('-hidden');
            } else {
                elmnt.set('+hidden');
            }
        });
    } else {
        $('.bookmark').set('-hidden');
    }
}


function filterRecent(range) {
    if (this.is('.active')) {
        // disable self
    } else {
        // disable self

    }
}


function dateDiffMins(d) {
    var reDate = /(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/
    var m = d.match(reDate);

    if (m) {
        lastVisit = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
        return (((new Date()) - lastVisit) / (60 * 1000));
    }

    return Infinity;
}


function openNode(node) {
    console.log(node);
}


/* todo */
function loadContent(callback) {
    var path = 'bookmarks.html'

    $.request('get', path)
    .then(
        function success(response) {
            callback(HTML(response));
        },
        function error(status, statusText, responseText) {
            err(path + ' ' + status);
        }
    );   
}


function err(msg) {
    console.log('Error ' + msg);
}


/* get rid of head and body */
function takeOver() {
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
}


/* add main menu */
function addMenu() {
    $('body').add(EE('ul', {id: 'main-menu'}, [
        EE('li', {$: 'menu-item'}, EE('a', {$: 'btn btn-menu active', '@title': 'Home'}, 'H')),
        EE('li', {$: 'menu-item'}, EE('a', {$: 'btn btn-menu', '@title': 'Bookmarks'}, 'B')),
        EE('li', {$: 'menu-item'}, EE('a', {$: 'btn btn-menu', '@title': 'Mail'}, 'M')),
        EE('li', {$: 'menu-item'}, EE('a', {$: 'btn btn-menu', '@title': 'K'}, 'K')),
        EE('ul', {$: 'main-menu-right'}, 
            EE('li', {$: 'menu-item'}, EE('a', {$: 'btn btn-menu', '@title': 'Whatever'}, 'W'))
        )
    ]))
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


/***** SEARCH *****/
function onInputChange(input) {
    var ids = searchIndex(input);

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

var searchData = null;

// data = [[title, id], [title, id], ...]
function buildSearchIndex(data) {
    searchData = {index: {}, words: {}};
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


function searchIndex(input) {
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


var PrimitiveSet = function() {
    this.itemsLst = [];
    this.itemsObj = {};
}

/* Primitive SET object */
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

