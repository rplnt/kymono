// /^u/.test(typeof define)&&function(a){var b=this.require=function(b){return a[b]};this.define=function(c,d){a[c]=a[c]||d(b)}}({}),define("minified",function(){function a(a){return a.substr(0,3)}function b(a){return a!=Eb?""+a:""}function c(a){return"string"==typeof a}function d(a){return!!a&&"object"==typeof a}function e(a){return a&&a.nodeType}function f(a){return"number"==typeof a}function g(a){return d(a)&&!!a.getDay}function h(a){return!0===a||!1===a}function i(a){var b=typeof a;return"object"==b?!(!a||!a.getDay):"string"==b||"number"==b||h(a)}function j(a){return a}function k(a){return a+1}function l(a,c,d){return b(a).replace(c,d!=Eb?d:"")}function m(a){return l(a,/[\\\[\]\/{}()*+?.$|^-]/g,"\\$&")}function n(a){return l(a,/^\s+|\s+$/g)}function o(a,b,c){for(var d in a)a.hasOwnProperty(d)&&b.call(c||a,d,a[d]);return a}function p(a,b,c){if(a)for(var d=0;d<a.length;d++)b.call(c||a,a[d],d);return a}function q(a,b,c){var d=[],e=db(b)?b:function(a){return b!=a};return p(a,function(b,f){e.call(c||a,b,f)&&d.push(b)}),d}function r(a,b,c,d){var e=[];return a(b,function(a,f){eb(a=c.call(d||b,a,f))?p(a,function(a){e.push(a)}):a!=Eb&&e.push(a)}),e}function s(a,b,c){return r(p,a,b,c)}function t(a){var b=0;return o(a,function(){b++}),b}function u(a){var b=[];return o(a,function(a){b.push(a)}),b}function v(a,b,c){var d=[];return p(a,function(e,f){d.push(b.call(c||a,e,f))}),d}function w(a,b){if(eb(a)){var c=vb(b);return M(G(a,0,c.length),c)}return b!=Eb&&a.substr(0,b.length)==b}function x(a,b){if(eb(a)){var c=vb(b);return M(G(a,-c.length),c)||!c.length}return b!=Eb&&a.substr(a.length-b.length)==b}function y(a){var b=a.length;return eb(a)?new ub(v(a,function(){return a[--b]})):l(a,/[\s\S]/g,function(){return a.charAt(--b)})}function z(a,b){var c={};return p(a,function(a){c[a]=b}),c}function A(a,b){var c,d=b||{};for(c in a)d[c]=a[c];return d}function B(a,b){for(var c=b,d=0;d<a.length;d++)c=A(a[d],c);return c}function C(a){return db(a)?a:function(b,c){return a===b?c:void 0}}function D(a,b,c){return b==Eb?c:0>b?Math.max(a.length+b,0):Math.min(a.length,b)}function E(a,b,c,d){b=C(b),d=D(a,d,a.length);for(var e=D(a,c,0);d>e;e++)if((c=b.call(a,a[e],e))!=Eb)return c}function F(a,b,c,d){b=C(b),d=D(a,d,-1);for(var e=D(a,c,a.length-1);e>d;e--)if((c=b.call(a,a[e],e))!=Eb)return c}function G(a,b,c){var d=[];if(a)for(c=D(a,c,a.length),b=D(a,b,0);c>b;b++)d.push(a[b]);return d}function H(a){return v(a,j)}function I(a){return function(){return new ub(O(a,arguments))}}function J(a){var b={};return q(a,function(a){return b[a]?!1:b[a]=1})}function K(a,b){var c=z(b,1);return q(a,function(a){var b=c[a];return c[a]=0,b})}function L(a,b){for(var c=0;c<a.length;c++)if(a[c]==b)return!0;return!1}function M(a,b){var c,d=db(a)?a():a,e=db(b)?b():b;return d==e?!0:d==Eb||e==Eb?!1:i(d)||i(e)?g(d)&&g(e)&&+d==+e:eb(d)?d.length==e.length&&!E(d,function(a,b){return M(a,e[b])?void 0:!0}):!eb(e)&&(c=u(d)).length==t(e)&&!E(c,function(a){return M(d[a],e[a])?void 0:!0})}function N(a,b,c){return db(a)?a.apply(c&&b,v(c||b,j)):void 0}function O(a,b,c){return v(a,function(a){return N(a,b,c)})}function P(a,b,c,d){return function(){return N(a,b,s([c,arguments,d],j))}}function Q(a,b){for(var c=0>b?"-":"",d=(c?-b:b).toFixed(0);d.length<a;)d="0"+d;return c+d}function R(a,b,c){var d,e=0,f=c?b:y(b);return a=(c?a:y(a)).replace(/./g,function(a){return"0"==a?(d=!1,f.charAt(e++)||"0"):"#"==a?(d=!0,f.charAt(e++)||""):d&&!f.charAt(e)?"":a}),c?a:b.substr(0,b.length-e)+y(a)}function S(a,b,c){return b!=Eb&&a?60*parseFloat(a[b]+a[b+1])+parseFloat(a[b]+a[b+2])+c.getTimezoneOffset():0}function T(a){return new Date(+a)}function U(a,b,c){return a["set"+b](a["get"+b]()+c),a}function V(a,b,c){return c==Eb?V(new Date,a,b):U(T(a),b.charAt(0).toUpperCase()+b.substr(1),c)}function W(a,b,c){var d=+b,e=+c,f=e-d;if(0>f)return-W(a,c,b);if(b={milliseconds:1,seconds:1e3,minutes:6e4,hours:36e5}[a])return f/b;for(b=a.charAt(0).toUpperCase()+a.substr(1),a=Math.floor(f/{fullYear:31536e6,month:2628e6,date:864e5}[a]-2),d=U(new Date(d),b,a),f=a;1.2*a+4>f;f++)if(+U(d,b,1)>e)return f}function X(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}function Y(a){return l(a,/[\x00-\x1f'"\u2028\u2029]/g,X)}function Z(a,b){function c(a,c){var d=[];return e.call(c||a,a,function(a,b){eb(a)?p(a,function(a,c){b.call(a,a,c)}):o(a,function(a,c){b.call(c,a,c)})},b||j,function(){N(d.push,d,arguments)},vb),d.join("")}if(Lb[a])return Lb[a];var d="with(_.isObject(obj)?obj:{}){"+v(a.split(/{{|}}}?/g),function(a,b){var c,d=n(a),e=l(d,/^{/),d=d==e?"esc(":"";return b%2?(c=/^each\b(\s+([\w_]+(\s*,\s*[\w_]+)?)\s*:)?(.*)/.exec(e))?"each("+(n(c[4])?c[4]:"this")+", function("+c[2]+"){":(c=/^if\b(.*)/.exec(e))?"if("+c[1]+"){":(c=/^else\b\s*(if\b(.*))?/.exec(e))?"}else "+(c[1]?"if("+c[2]+")":"")+"{":(c=/^\/(if)?/.exec(e))?c[1]?"}\n":"});\n":(c=/^(var\s.*)/.exec(e))?c[1]+";":(c=/^#(.*)/.exec(e))?c[1]:(c=/(.*)::\s*(.*)/.exec(e))?"print("+d+'_.formatValue("'+Y(c[2])+'",'+(n(c[1])?c[1]:"this")+(d&&")")+"));\n":"print("+d+(n(e)?e:"this")+(d&&")")+");\n":a?'print("'+Y(a)+'");\n':void 0}).join("")+"}",e=Function("obj","each","esc","print","_",d);return 99<Mb.push(c)&&delete Lb[Mb.shift()],Lb[a]=c}function $(a){return l(a,/[<>'"&]/g,function(a){return"&#"+a.charCodeAt(0)+";"})}function _(a,b){return Z(a,$)(b)}function ab(a){return function(b,c){return new ub(a(this,b,c))}}function bb(a){return function(b,c,d){return a(this,b,c,d)}}function cb(a){return function(b,c,d){return new ub(a(b,c,d))}}function db(a){return"function"==typeof a&&!a.item}function eb(a){return a&&a.length!=Eb&&!c(a)&&!e(a)&&!db(a)&&a!==xb}function fb(a){return parseFloat(l(a,/^[^\d-]+/))}function gb(a){return a.Nia=a.Nia||++Ab}function hb(a,b){var c,d=[],e={};return rb(a,function(a){rb(b(a),function(a){e[c=gb(a)]||(d.push(a),e[c]=!0)})}),d}function ib(a,b){var c={$position:"absolute",$visibility:"hidden",$display:"block",$height:Eb},d=a.get(c),c=a.set(c).get("clientHeight");return a.set(d),c*b+"px"}function jb(a){Bb?Bb.push(a):setTimeout(a,0)}function kb(a,b,c){return ob(a,b,c)[0]}function lb(a,b,c){return a=nb(document.createElement(a)),eb(b)||b!=Eb&&!d(b)?a.add(b):a.set(b).add(c)}function mb(a){return r(rb,a,function(a){return eb(a)?mb(a):(e(a)&&(a=a.cloneNode(!0),a.removeAttribute&&a.removeAttribute("id")),a)})}function nb(a,b,c){return db(a)?jb(a):new ub(ob(a,b,c))}function ob(a,b,d){function f(a){return eb(a)?r(rb,a,f):a}function g(a){return q(r(rb,a,f),function(a){for(;a=a.parentNode;)if(a==b[0]||d)return a==b[0]})}return b?1!=(b=ob(b)).length?hb(b,function(b){return ob(a,b,d)}):c(a)?1!=e(b[0])?[]:d?g(b[0].querySelectorAll(a)):b[0].querySelectorAll(a):g(a):c(a)?document.querySelectorAll(a):r(rb,a,f)}function pb(a,b){function d(a,b){var c=RegExp("(^|\\s+)"+a+"(?=$|\\s)","i");return function(d){return a?c.test(d[b]):!0}}var g,h,i={},j=i;return db(a)?a:f(a)?function(b,c){return c==a}:!a||"*"==a||c(a)&&(j=/^([\w-]*)\.?([\w-]*)$/.exec(a))?(g=d(j[1],"tagName"),h=d(j[2],"className"),function(a){return 1==e(a)&&g(a)&&h(a)}):b?function(c){return nb(a,b).find(c)!=Eb}:(nb(a).each(function(a){i[gb(a)]=!0}),function(a){return i[gb(a)]})}function qb(a){var b=pb(a);return function(a){return b(a)?Eb:!0}}function rb(a,b){return eb(a)?p(a,b):a!=Eb&&b(a,0),a}function sb(){this.state=null,this.values=[],this.parent=null}function tb(){var a,b,c=[],e=arguments,f=e.length,g=0,h=0,i=new sb;return i.errHandled=function(){h++,i.parent&&i.parent.errHandled()},a=i.fire=function(a,b){return null==i.state&&null!=a&&(i.state=!!a,i.values=eb(b)?b:[b],setTimeout(function(){p(c,function(a){a()})},0)),i},p(e,function j(b,c){try{b.then?b.then(function(b){(d(b)||db(b))&&db(b.then)?j(b,c):(i.values[c]=H(arguments),++g==f&&a(!0,2>f?i.values[c]:i.values))},function(){i.values[c]=H(arguments),a(!1,2>f?i.values[c]:[i.values[c][0],i.values,c])}):b(function(){a(!0,H(arguments))},function(){a(!1,H(arguments))})}catch(e){a(!1,[e,i.values,c])}}),i.stop=function(){return p(e,function(a){a.stop&&a.stop()}),i.stop0&&N(i.stop0)},b=i.then=function(a,b){function e(){try{var c=i.state?a:b;db(c)?function g(a){try{var b,c=0;if((d(a)||db(a))&&db(b=a.then)){if(a===f)throw new TypeError;b.call(a,function(a){c++||g(a)},function(a){c++||f.fire(!1,[a])}),f.stop0=a.stop}else f.fire(!0,[a])}catch(e){if(!c++&&(f.fire(!1,[e]),!h))throw e}}(N(c,wb,i.values)):f.fire(i.state,i.values)}catch(e){if(f.fire(!1,[e]),!h)throw e}}var f=tb();return db(b)&&i.errHandled(),f.stop0=i.stop,f.parent=i,null!=i.state?setTimeout(e,0):c.push(e),f},i.always=function(a){return b(a,a)},i.error=function(a){return b(0,a)},i}function ub(a,b){var c,d,e,f,g,h=0;if(a)for(c=0,d=a.length;d>c;c++)if(e=a[c],b&&eb(e))for(f=0,g=e.length;g>f;f++)this[h++]=e[f];else this[h++]=e;else this[h++]=b;this.length=h,this._=!0}function vb(){return new ub(arguments,!0)}var wb,xb=window,yb={},zb={},Ab=1,Bb=/^[ic]/.test(document.readyState)?Eb:[],Cb={},Db=0,Eb=null,Fb="January,February,March,April,May,June,July,August,September,October,November,December".split(/,/g),Gb=v(Fb,a),Hb="Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(/,/g),Ib=v(Hb,a),Jb={y:["FullYear",j],Y:["FullYear",function(a){return a%100}],M:["Month",k],n:["Month",Gb],N:["Month",Fb],d:["Date",j],m:["Minutes",j],H:["Hours",j],h:["Hours",function(a){return a%12||12}],k:["Hours",k],K:["Hours",function(a){return a%12}],s:["Seconds",j],S:["Milliseconds",j],a:["Hours","am,am,am,am,am,am,am,am,am,am,am,am,pm,pm,pm,pm,pm,pm,pm,pm,pm,pm,pm,pm".split(/,/g)],w:["Day",Ib],W:["Day",Hb],z:["TimezoneOffset",function(a,b,c){return c?c:(b=0>a?-a:a,(a>0?"-":"+")+Q(2,Math.floor(b/60))+Q(2,b%60))}]},Kb={y:0,Y:[0,-2e3],M:[1,1],n:[1,Gb],N:[1,Fb],d:2,m:4,H:3,h:3,K:[3,1],k:[3,1],s:5,S:6,a:[3,"am,pm".split(/,/g)]},Lb={},Mb=[];return A({each:bb(p),filter:ab(q),collect:ab(s),map:ab(v),toObject:bb(z),equals:bb(M),sub:ab(G),reverse:bb(y),find:bb(E),findLast:bb(F),startsWith:bb(w),endsWith:bb(x),contains:bb(L),call:ab(O),array:bb(H),unite:bb(I),merge:bb(B),uniq:ab(J),intersection:ab(K),join:function(a){return v(this,j).join(a)},reduce:function(a,b){return p(this,function(c,d){b=a.call(this,b,c,d)}),b},sort:function(a){return new ub(v(this,j).sort(a))},remove:function(){rb(this,function(a){a.parentNode.removeChild(a)})},text:function(){return r(rb,this,function(a){return a.textContent}).join("")},trav:function(a,b,c){var d=f(b),e=pb(d?Eb:b),g=d?b:c;return new ub(hb(this,function(b){for(var c=[];(b=b[a])&&c.length!=g;)e(b)&&c.push(b);return c}))},next:function(a,b){return this.trav("nextSibling",a,b||1)},up:function(a,b){return this.trav("parentNode",a,b||1)},select:function(a,b){return nb(a,this,b)},is:function(a){return!this.find(qb(a))},only:function(a){return new ub(q(this,pb(a)))},not:function(a){return new ub(q(this,qb(a)))},get:function(a,b){var d,e,f,g=this,h=g[0];return h?c(a)?(d=/^(\W*)(.*)/.exec(l(a,/^%/,"@data-")),e=d[1],h=zb[e]?zb[e](this,d[2]):"$"==a?g.get("className"):"$$"==a?g.get("@style"):"$$slide"==a?g.get("$height"):"$$fade"==a||"$$show"==a?"hidden"==g.get("$visibility")||"none"==g.get("$display")?0:"$$fade"==a?isNaN(g.get("$opacity",!0))?1:g.get("$opacity",!0):1:"$"==e?xb.getComputedStyle(h,Eb).getPropertyValue(l(d[2],/[A-Z]/g,function(a){return"-"+a.toLowerCase()})):"@"==e?h.getAttribute(d[2]):h[d[2]],b?fb(h):h):(f={},(eb(a)?rb:o)(a,function(a){f[a]=g.get(a,b)}),f):void 0},set:function(a,b){var d,e,f=this;return b!==wb?(d=/^(\W*)(.*)/.exec(l(l(a,/^\$float$/,"cssFloat"),/^%/,"@data-")),e=d[1],yb[e]?yb[e](this,d[2],b):"$$fade"==a?this.set({$visibility:b?"visible":"hidden",$opacity:b}):"$$slide"==a?f.set({$visibility:b?"visible":"hidden",$overflow:"hidden",$height:/px/.test(b)?b:function(a,c,d){return ib(nb(d),b)}}):"$$show"==a?b?f.set({$visibility:b?"visible":"hidden",$display:""}).set({$display:function(a){return"none"==a?"block":a}}):f.set({$display:"none"}):"$$"==a?f.set("@style",b):rb(this,function(c,f){var g=db(b)?b(nb(c).get(a),f,c):b;"$"==e?d[2]?c.style[d[2]]=g:rb(g&&g.split(/\s+/),function(a){var b=l(a,/^[+-]/),d=c.className||"",e=l(d,RegExp("(^|\\s+)"+b+"(?=$|\\s)"));(/^\+/.test(a)||b==a&&d==e)&&(e+=" "+b),c.className=n(e)}):"$$scrollX"==a?c.scroll(g,nb(c).get("$$scrollY")):"$$scrollY"==a?c.scroll(nb(c).get("$$scrollX"),g):"@"==e?g==Eb?c.removeAttribute(d[2]):c.setAttribute(d[2],g):c[d[2]]=g})):c(a)||db(a)?f.set("$",a):o(a,function(a,b){f.set(a,b)}),f},show:function(){return this.set("$$show",1)},hide:function(){return this.set("$$show",0)},add:function(a,b){return this.each(function(c,d){function f(a){eb(a)?rb(a,f):db(a)?f(a(c,d)):a!=Eb&&(a=e(a)?a:document.createTextNode(a),g?g.parentNode.insertBefore(a,g.nextSibling):b?b(a,c,c.parentNode):c.appendChild(a),g=a)}var g;f(d&&!db(a)?mb(a):a)})},fill:function(a){return this.each(function(a){nb(a.childNodes).remove()}).add(a)},addAfter:function(a){return this.add(a,function(a,b,c){c.insertBefore(a,b.nextSibling)})},addBefore:function(a){return this.add(a,function(a,b,c){c.insertBefore(a,b)})},addFront:function(a){return this.add(a,function(a,b){b.insertBefore(a,b.firstChild)})},replace:function(a){return this.add(a,function(a,b,c){c.replaceChild(a,b)})},clone:ab(mb),animate:function(a,b,c){var d,e=tb(),f=this,g=r(rb,this,function(b,d){var e,f=nb(b),g={};return o(e=f.get(a),function(c,e){var h=a[c];g[c]=db(h)?h(e,d,b):"$$slide"==c?ib(f,h):h}),f.dial(e,g,c)}),h=b||500;return e.stop0=function(){return e.fire(!1),d()},d=nb.loop(function(a){O(g,[a/h]),a>=h&&(d(),e.fire(!0,[f]))}),e},dial:function(a,c,d){function e(a,b){return/^#/.test(a)?parseInt(6<a.length?a.substr(2*b+1,2):(a=a.charAt(b+1))+a,16):fb(a.split(",")[b])}var f=this,g=d||0,h=db(g)?g:function(a,b,c){return c*(b-a)*(g+(1-g)*c*(3-2*c))+a};return function(d){o(a,function(a,g){var i=c[a],j=0;f.set(a,0>=d?g:d>=1?i:/^#|rgb\(/.test(i)?"rgb("+Math.round(h(e(g,j),e(i,j++),d))+","+Math.round(h(e(g,j),e(i,j++),d))+","+Math.round(h(e(g,j),e(i,j++),d))+")":l(i,/-?[\d.]+/,b(h(fb(g),fb(i),d))))})}},toggle:function(a,b,c,d){var e,f,g=this,h=!1;return b?(g.set(a),function(i){i!==h&&(f=(h=!0===i||!1===i?i:!h)?b:a,c?(e=g.animate(f,e?e.stop():c,d)).then(function(){e=Eb}):g.set(f))}):g.toggle(l(a,/\b(?=\w)/g,"-"),l(a,/\b(?=\w)/g,"+"))},values:function(a){var c=a||{};return this.each(function(a){var d=a.name||a.id,e=b(a.value);if(/form/i.test(a.tagName))for(d=0;d<a.elements.length;d++)nb(a.elements[d]).values(c);else!d||/ox|io/i.test(a.type)&&!a.checked||(c[d]=c[d]==Eb?e:r(rb,[c[d],e],j))}),c},offset:function(){for(var a=this[0],b={x:0,y:0};a;)b.x+=a.offsetLeft,b.y+=a.offsetTop,a=a.offsetParent;return b},on:function(a,d,e,f,g){return db(d)?this.on(Eb,a,d,e,f):c(f)?this.on(a,d,e,Eb,f):this.each(function(c,h){rb(a?ob(a,c):c,function(a){rb(b(d).split(/\s/),function(b){function c(b,c,d){var j,l=!g;if(d=g?d:a,g)for(j=pb(g,a);d&&d!=a&&!(l=j(d));)d=d.parentNode;return!l||i!=b||e.apply(nb(d),f||[c,h])&&"?"==k||"|"==k}function d(a){c(i,a,a.target)||(a.preventDefault(),a.stopPropagation())}var i=l(b,/[?|]/g),k=l(b,/[^?|]/g),m=("blur"==i||"focus"==i)&&!!g,n=Ab++;a.addEventListener(i,d,m),a.M||(a.M={}),a.M[n]=c,e.M=r(rb,[e.M,function(){a.removeEventListener(i,d,m),delete a.M[n]}],j)})})})},onOver:function(a,b){var c=this,d=[];return db(b)?this.on(a,"|mouseover |mouseout",function(a,e){var f=a.relatedTarget||a.toElement,g="mouseout"!=a.type;d[e]===g||!g&&f&&(f==c[e]||nb(f).up(c[e]).length)||(d[e]=g,b.call(this,g,a))}):this.onOver(Eb,a)},onFocus:function(a,b,c){return db(b)?this.on(a,"|blur",b,[!1],c).on(a,"|focus",b,[!0],c):this.onFocus(Eb,a,b)},onChange:function(a,b,c){return db(b)?this.on(a,"|input |change |click",function(a,c){var d=this[0],e=/ox|io/i.test(d.type)?d.checked:d.value;d.NiaP!=e&&b.call(this,d.NiaP=e,c)},c):this.onChange(Eb,a,b)},onClick:function(a,b,c,d){return db(b)?this.on(a,"click",b,c,d):this.onClick(Eb,a,b,c)},trigger:function(a,b){return this.each(function(c){for(var d=!0,e=c;e&&d;)o(e.M,function(e,f){d=d&&f(a,b,c)}),e=e.parentNode})},per:function(a,b){if(db(a))for(var c=this.length,d=0;c>d;d++)a.call(this,new ub(Eb,this[d]),d);else nb(a,this).per(b);return this},ht:function(a,b){var c=2<arguments.length?B(G(arguments,1)):b;return this.set("innerHTML",db(a)?a(c):/{{/.test(a)?_(a,c):/^#\S+$/.test(a)?_(kb(a).text,c):a)}},ub.prototype),A({request:function(a,c,d,e){e=e||{};var f,g=0,h=tb(),i=d&&d.constructor==e.constructor;try{h.xhr=f=new XMLHttpRequest,h.stop0=function(){f.abort()},i&&(d=r(o,d,function(a,b){return r(rb,b,function(b){return encodeURIComponent(a)+(b!=Eb?"="+encodeURIComponent(b):"")})}).join("&")),d==Eb||/post/i.test(a)||(c+="?"+d,d=Eb),f.open(a,c,!0,e.user,e.pass),i&&/post/i.test(a)&&f.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),o(e.headers,function(a,b){f.setRequestHeader(a,b)}),o(e.xhr,function(a,b){f[a]=b}),f.onreadystatechange=function(){4!=f.readyState||g++||(200<=f.status&&300>f.status?h.fire(!0,[f.responseText,f]):h.fire(!1,[f.status,f.responseText,f]))},f.send(d)}catch(j){g||h.fire(!1,[0,Eb,b(j)])}return h},toJSON:JSON.stringify,parseJSON:JSON.parse,ready:jb,loop:function(a){function b(a){o(Cb,function(b,c){c(a)}),Db&&g(b)}function c(){return Cb[f]&&(delete Cb[f],Db--),e}var d,e=0,f=Ab++,g=xb.requestAnimationFrame||function(a){setTimeout(function(){a(+new Date)},33)};return Cb[f]=function(b){d=d||b,a(e=b-d,c)},Db++||g(b),c},off:function(a){O(a.M),a.M=Eb},setCookie:function(a,b,c,e){document.cookie=a+"="+(e?b:escape(b))+(c?"; expires="+(d(c)?c:new Date(+new Date+864e5*c)).toUTCString():"")},getCookie:function(a,b){var c,d=(c=RegExp("(^|;)\\s*"+a+"=([^;]*)").exec(document.cookie))&&c[2];return b?d:d&&unescape(d)},wait:function(a,b){var c=tb(),d=setTimeout(function(){c.fire(!0,b)},a);return c.stop0=function(){c.fire(!1),clearTimeout(d)},c}},nb),A({filter:cb(q),collect:cb(s),map:cb(v),sub:cb(G),reverse:y,each:p,toObject:z,find:E,findLast:F,contains:L,startsWith:w,endsWith:x,equals:M,call:cb(O),array:H,unite:I,merge:B,uniq:cb(J),intersection:cb(K),keys:cb(u),values:cb(function(a,b){var c=[];return b?p(b,function(b){c.push(a[b])}):o(a,function(a,b){c.push(b)}),c}),copyObj:A,extend:function(a){return B(G(arguments,1),a)},range:function(a,b){for(var c=[],d=b==Eb?a:b,e=b!=Eb?a:0;d>e;e++)c.push(e);return new ub(c)},bind:P,partial:function(a,b,c){return P(a,this,b,c)},eachObj:o,mapObj:function(a,b,c){var d={};return o(a,function(e,f){d[e]=b.call(c||a,e,f)}),d},filterObj:function(a,b,c){var d={};return o(a,function(e,f){b.call(c||a,e,f)&&(d[e]=f)}),d},isList:eb,isFunction:db,isObject:d,isNumber:f,isBool:h,isDate:g,isValue:i,isString:c,toString:b,dateClone:T,dateAdd:V,dateDiff:W,dateMidnight:function(a){return a=a||new Date,new Date(a.getFullYear(),a.getMonth(),a.getDate())},pad:Q,formatValue:function(a,d){var e,h,i=l(a,/^\?/);return g(d)?((h=/^\[(([+-])(\d\d)(\d\d))\]\s*(.*)/.exec(i))&&(e=h[1],d=V(d,"minutes",S(h,2,d)),i=h[5]),l(i,/(\w)(\1*)(?:\[([^\]]+)\])?/g,function(a,b,f,g){return(b=Jb[b])&&(a=d["get"+b[0]](),g=g&&g.split(","),a=eb(b[1])?(g||b[1])[a]:b[1](a,g,e),a==Eb||c(a)||(a=Q(f.length+1,a))),a})):E(i.split(/\s*\|\s*/),function(a){var c,e;if(c=/^([<>]?)(=?)([^:]*?)\s*:\s*(.*)$/.exec(a)){if(a=d,e=+c[3],(isNaN(e)||!f(a))&&(a=a==Eb?"null":b(a),e=c[3]),c[1]){if(!c[2]&&a==e||"<"==c[1]&&a>e||">"==c[1]&&e>a)return Eb}else if(a!=e)return Eb;c=c[4]}else c=a;return f(d)?c.replace(/[0#](.*[0#])?/,function(a){var b,c=/^([^.]+)(\.)([^.]+)$/.exec(a)||/^([^,]+)(,)([^,]+)$/.exec(a),e=0>d?"-":"",f=/(\d+)(\.(\d+))?/.exec((e?-d:d).toFixed(c?c[3].length:0));return a=c?c[1]:a,b=c?R(c[3],l(f[3],/0+$/),!0):"",(e?"-":"")+("#"==a?f[1]:R(a,f[1]))+(b.length?c[2]:"")+b}):c})},parseDate:function(a,b){var c,d,e,f,g,h,i,j,k,o={},p=1,q=l(a,/^\?/);if(q!=a&&!n(b))return Eb;if((e=/^\[([+-])(\d\d)(\d\d)\]\s*(.*)/.exec(q))&&(c=e,q=e[4]),!(e=RegExp(q.replace(/(.)(\1*)(?:\[([^\]]*)\])?/g,function(a,b,c,e){return/[dmhkyhs]/i.test(b)?(o[p++]=b,a=c.length+1,"(\\d"+(2>a?"+":"{1,"+a+"}")+")"):"z"==b?(d=p,p+=3,"([+-])(\\d\\d)(\\d\\d)"):/[Nna]/.test(b)?(o[p++]=[b,e&&e.split(",")],"([a-zA-Z\\u0080-\\u1fff]+)"):/w/i.test(b)?"[a-zA-Z\\u0080-\\u1fff]+":/\s/.test(b)?"\\s+":m(a)})).exec(b)))return wb;for(q=[0,0,0,0,0,0,0],f=1;p>f;f++)if(g=e[f],h=o[f],eb(h)){if(i=h[0],j=Kb[i],k=j[0],h=E(h[1]||j[1],function(a,b){return w(g.toLowerCase(),a.toLowerCase())?b:void 0}),h==Eb)return wb;q[k]="a"==i?q[k]+12*h:h}else h&&(i=parseFloat(g),j=Kb[h],eb(j)?q[j[0]]+=i-j[1]:q[j]+=i);return q=new Date(q[0],q[1],q[2],q[3],q[4],q[5],q[6]),V(q,"minutes",-S(c,1,q)-S(e,d,q))},parseNumber:function(a,b){var c=l(a,/^\?/);return c==a||n(b)?(c=/(^|[^0#.,])(,|[0#.]*,[0#]+|[0#]+\.[0#]+\.[0#.,]*)($|[^0#.,])/.test(c)?",":".",c=parseFloat(l(l(l(b,","==c?/\./g:/,/g),c,"."),/^[^\d-]*(-?\d)/,"$1")),isNaN(c)?wb:c):Eb},trim:n,isEmpty:function(a,b){return a==Eb||!a.length||b&&/^\s*$/.test(a)},escapeRegExp:m,escapeHtml:$,format:function(a,b,c){return Z(a,c)(b)},template:Z,formatHtml:_,promise:tb},vb),document.addEventListener("DOMContentLoaded",function(){O(Bb),Bb=Eb},!1),{HTML:function(){var a=lb("div");return vb(N(a.ht,a,arguments)[0].childNodes)},_:vb,$:nb,$$:kb,EE:lb,M:ub,getter:zb,setter:yb}});

/* Init minified.js */
var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;

var conf = {
    base: '/id/8099985/',
    // base: 'http://localhost:8000/',
    name: 'KyMoNo',
    version: 'v0.0.1',
    css: 'kymono.css',
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








