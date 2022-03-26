let $ = (...a) => document.querySelector(...a);
let $$ = (...a) => document.querySelectorAll(...a);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;
function $el(cl = "", tn = "div", ht = "", fn) {
    if (cl instanceof Array) {
        cl = cl.join(" ");
    }
    if (!tn) {
        tn = "div";
    }
    cl = cl.toString();
    let el = document.createElement(tn);
    if (ht) {
        el.innerHTML = ht;
    }
    el.className = cl;
    if (fn) {
        fn(el);
    }
    return el;
}
Element.prototype.goUpInTree = function (query) {
    let el = this;
    while (el) {
        if (el.classList.contains(query)) {
            return el;
        } else {
            el = el.parentElement;
        }
    }
    return null;
};
Element.prototype.setClass = function (a, b) {
    if (b) {
        this.classList.add(a);
    } else {
        this.classList.remove(a);
    }
};
Array.prototype.lastElement = function () {
    return this[this.length - 1];
};