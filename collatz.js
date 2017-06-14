var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
//import { compose } from '@typed/compose';
/**
 * tool box for programming
 */
var tools;
(function (tools) {
    /**
     * Compose functions given in the args array from right to left
     * example: given a, b and c some function. if agrs=[a,b,c]
     *      then if will return a function that apply c then b then a
     *      with x the arguments of c it gives us a(b(c(x))) equivalente to (a∘b∘c)(x)
     *      see https://en.wikipedia.org/wiki/Function_composition_(computer_science)
     *
     * Come from http://blakeembrey.com/articles/2014/01/compose-functions-javascript/ (02/06/2017)
     *
     * @param args functions that are coposable
     * @return the composed function
     */
    function compose() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var fns = arguments;
        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                result = fns[i].call(this, result);
            }
            return result;
        };
    }
    tools.compose = compose;
    ;
    /**
     * same as compose
     * but in reverse, so apply left to right
     * @param args functions that are composable
     * @return composed function
     */
    tools.composeReverse = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var fns = args;
        return function (result) {
            for (var i = 0; i < fns.length; i++) {
                result = fns[i].call(this, result);
            }
            return result;
        };
    };
    //let comp = f => g => x => f(g(x))
    //console.log(comp(x=>x*10)(x=>x[0]-x[1])([4,6])) // [4,6] -> 4-6 -> -2*10
    //console.log(compose(x => x * 10, x => x[0] - x[1])([4, 6]))
    //console.log(composeReverse(x => x[0] - x[1], x => x * 10)([4, 6]))
})(tools || (tools = {}));
var collatzFun;
(function (collatzFun) {
    //------------------------------------------------
    //-----------------global variables---------------
    /** the canvas rendering object */
    collatzFun.ctxG = document.getElementById('renderingCanvas').getContext('2d');
    //------------------------------------------------
    //-------------------point factory----------------
    /**
     * create a 2d point structure
     * @param x x-coordinate or abscissa
     * @param y y-coordinate or ordinate
     * @return { x: x, y: y }
     */
    function point(x, y) { return { x: x, y: y }; }
    collatzFun.point = point;
    //let point = (x: number, y: number): Point => ({ x: x, y: y })
    /*
        is it better to make as it follow performance-wise?
        class Point{
            constructor(
                public x: number,
                public y: number
            ){}
        }
     */
    //----------------------------------------------
    //---------------drawing-------------------------
    //......line drawing........
    function lineTo(t, p) {
        t.ctx.lineTo(p.x, p.y);
        return __assign({}, t, { précèdent: t, courrant: p });
    }
    function lineToComp(p) {
        return function (t) {
            t.ctx.lineTo(p.x, p.y);
            return __assign({}, t, { précèdent: t, courrant: p });
        };
    }
    //little test to avoid return and ;
    var lineTo_LOL = function (t, p) { return (function (x) { return (__assign({}, t, { précèdent: t, courrant: p })); })(t.ctx.moveTo(p.x, p.y)); };
    //.......stroke line........
    function endDétaillé(t) {
        t.ctx.stroke();
        function f(x) {
            return (t.précèdent === undefined) ?
                [] : [x.courrant].concat(f(t.précèdent));
        }
        return f(t);
    }
    var end = function (t) { t.ctx.stroke(); return t.ctx; };
    //......init line
    var start = function (c, p, apparence) {
        var ctx = collatzFun.ctxG;
        ctx.moveTo(p.x, p.y);
        return { courrant: p, ctx: ctx };
    }; //TODO gérer le | null
    var startComp = function (p, apparence) { return function (ctx) {
        if (apparence != undefined)
            apparence(ctx);
        ctx.moveTo(p.x, p.y);
        return { courrant: p, ctx: ctx };
    }; }; //TODO gérer le | null
    var pointArr2TracéConstructor = function (c) { return function (_a) {
        var s = _a[0], l = _a.slice(1);
        return tools.composeReverse.apply(tools, [startComp(s)].concat(l.map(function (x) { return lineToComp(x); }), [end]))(c);
    }; };
    var trace = function (p1, p2) {
        return function (ctx) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            return ctx;
        };
    };
    var multi = function (t, l) {
        return l.map(function (p) {
            trace(t.courrant, p);
            return __assign({}, t, { précèdent: t, courrant: p });
        });
    };
    var multiComp = function (_a) {
        var p = _a[0], l = _a.slice(1);
        return function (t) {
            return l.map(function (p) {
                trace(t.courrant, p);
                return __assign({}, t, { précèdent: t, courrant: p });
            });
        };
    };
    var multiSimpleComp = function (_a) {
        var p = _a[0], l = _a.slice(1);
        return function (t) {
            return l.map(function (p) {
                //trace(t.courrant, p)
                return __assign({}, t, { précèdent: t, courrant: p, ctx: trace(t.courrant, p)(t.ctx) });
            });
        };
    };
    var collatzInv = function (x) {
        return (((2 * x - 1) % 3 != 0 || x == 2) ?
            { pair: 2 * x } :
            { pair: 2 * x, impair: (2 * x - 1) / 3 });
    };
    //console.log(collatzInv(20))
    /*              courrant,  limite     */
    var recTest = function (n, l) {
        if (l == 0)
            return { courrant: n };
        var tmp = collatzInv(n);
        return (tmp.impair == undefined) ?
            { courrant: n, suivant: { pair: recTest(tmp.pair, l - 1) } } :
            { courrant: n, suivant: { pair: recTest(tmp.pair, l - 1), impair: recTest(tmp.impair, l - 1) } };
    };
    collatzFun.collatzRec = function (n) {
        if (n === void 0) { n = 1; }
        return (function (tmp) {
            return (tmp.impair == undefined) ?
                { courrant: n, suivant: { pair: collatzFun.collatzRec(tmp.pair) } } :
                { courrant: n, suivant: { pair: collatzFun.collatzRec(tmp.pair), impair: collatzFun.collatzRec(tmp.impair) } };
        })(collatzInv(n));
    };
    /*let calcColPointBig = (d: angle, long: number) => (a: angle, c: Point, pair: boolean) =>
        (pair) ?
            point(c.x + long * Math.cos(a + d), c.y + long * Math.sin(a + d)) :
            point(c.x + long * Math.cos(a - d), c.y + long * Math.sin(a - d))

    let calcColPoint = calcColPointBig(0.15, 30)*/
    function calcColPointBig(d, long) {
        return function innner(a, c, pair) {
            //d /= 1.005
            long /= 1.0001;
            return (pair) ?
                point(c.x + long * Math.cos(a + d), c.y + long * Math.sin(a + d)) :
                point(c.x + long * Math.cos(a - d), c.y + long * Math.sin(a - d));
        };
    }
    var calcColPoint = calcColPointBig(0.6, 10);
    /*
        export let collatzAff = (x: collatzCoor): { pair: collatzCoor, impair?: collatzCoor } =>
            (({ pair, impair }: { pair: number, impair?: number }, a: angle) =>
                (impair == undefined) ?
                    { pair: { n: pair, préc: x, courr: calcColPoint(a, x.courr, true) } } :
                    {
                        pair: { n: pair, préc: x, courr: calcColPoint(a, x.courr, true) },
                        impair: { n: impair, préc: x, courr: calcColPoint(a, x.courr, false) }
                    }
            )(collatzInv(x.n), Math.atan2(x.courr.y - x.préc.courr.y, x.courr.x - x.préc.courr.x))
    */
    function collatzAff(x) {
        var tmp = collatzInv(x.n);
        var a = Math.atan2(x.courr.y - x.préc.courr.y, x.courr.x - x.préc.courr.x);
        //console.log('x = ' + x.n + ' tmp = ' + tmp.pair + ' ' + tmp.impair)
        //console.log(calcColPoint(a, x.courr, true))
        return (tmp.impair == undefined) ?
            { pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } }, courr: calcColPoint(a, x.courr, true) } } :
            {
                pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } }, courr: calcColPoint(a, x.courr, true) },
                impair: { n: tmp.impair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } }, courr: calcColPoint(a, x.courr, false) }
            };
    }
    var abord = 7;
    function collatzOpti(p, a, n, l, b, w, f) {
        f(w);
        if (l > 0) {
            var tmp = collatzInv(n);
            if (tmp.impair != undefined) {
                var p_tmp = calcColPoint(a, p, false);
                collatzFun.ctxG.moveTo(p.x, p.y);
                collatzFun.ctxG.lineTo(p_tmp.x, p_tmp.y);
                collatzOpti(p_tmp, Math.atan2(p_tmp.y - p.y, p_tmp.x - p.x), tmp.impair, l - 1, Math.abs(b - 2), w / 1.02, f);
            }
            if (b < abord) {
                var p_tmp = calcColPoint(a, p, true);
                collatzFun.ctxG.moveTo(p.x, p.y);
                collatzFun.ctxG.lineTo(p_tmp.x, p_tmp.y);
                collatzOpti(p_tmp, Math.atan2(p_tmp.y - p.y, p_tmp.x - p.x), tmp.pair, l - 1, b + 2, w / 1.02, f);
            }
            else {
                collatzFun.ctxG.stroke();
                collatzFun.ctxG.beginPath();
            }
        }
        else {
            collatzFun.ctxG.stroke();
            collatzFun.ctxG.beginPath();
        }
    }
    collatzFun.collatzOpti = collatzOpti;
})(collatzFun || (collatzFun = {}));
var collatzStep;
(function (collatzStep) {
    collatzStep.ctxG = document.getElementById('renderingCanvas').getContext('2d'); //add warn
    var point = function (x, y) { return ({ x: x, y: y }); };
    var collatzInv = function (x) {
        return (((2 * x - 1) % 3 != 0 || x == 2) ?
            { pair: 2 * x } :
            { pair: 2 * x, impair: (2 * x - 1) / 3 });
    };
    //console.log(collatzInv(20))
    /*         courrant,  limite     */
    var rec = function (n, l) {
        if (l == 0)
            return { courrant: n };
        var tmp = collatzInv(n);
        return (tmp.impair == undefined) ?
            { courrant: n, suivant: { pair: rec(tmp.pair, l - 1) } } :
            { courrant: n, suivant: { pair: rec(tmp.pair, l - 1), impair: rec(tmp.impair, l - 1) } };
    };
    collatzStep.collatzRec = function (n) {
        if (n === void 0) { n = 1; }
        return (function (tmp) {
            return (tmp.impair == undefined) ?
                { courrant: n, suivant: { pair: collatzStep.collatzRec(tmp.pair) } } :
                { courrant: n, suivant: { pair: collatzStep.collatzRec(tmp.pair), impair: collatzStep.collatzRec(tmp.impair) } };
        })(collatzInv(n));
    };
    /*let calcColPointBig = (d: angle, long: number) => (a: angle, c: Point, pair: boolean) =>
        (pair) ?
            point(c.x + long * Math.cos(a + d), c.y + long * Math.sin(a + d)) :
            point(c.x + long * Math.cos(a - d), c.y + long * Math.sin(a - d))

    let calcColPoint = calcColPointBig(0.15, 30)*/
    function calcColPointBig(d, long) {
        return function innner(a, c, pair) {
            d -= 0.00001; //d /= 1.0001
            long /= 1.0001;
            return (pair) ?
                point(c.x + long * Math.cos(a + d * 1.2) * 3, c.y + long * Math.sin(a + d * 1.2 /*+ Math.random() / 100*/) * 3) :
                point(c.x + long * Math.cos(a - d * 1.6) * 3, c.y + long * Math.sin(a - d * 1.6) * 3);
        };
    }
    var calcColPoint = calcColPointBig(0.3, 5);
    /*
        export let collatzAff = (x: collatzCoor): { pair: collatzCoor, impair?: collatzCoor } =>
            (({ pair, impair }: { pair: number, impair?: number }, a: angle) =>
                (impair == undefined) ?
                    { pair: { n: pair, préc: x, courr: calcColPoint(a, x.courr, true) } } :
                    {
                        pair: { n: pair, préc: x, courr: calcColPoint(a, x.courr, true) },
                        impair: { n: impair, préc: x, courr: calcColPoint(a, x.courr, false) }
                    }
            )(collatzInv(x.n), Math.atan2(x.courr.y - x.préc.courr.y, x.courr.x - x.préc.courr.x))
    */
    function collatzAff(x) {
        var tmp = collatzInv(x.n);
        var a = Math.atan2(x.courr.y - x.préc.courr.y, x.courr.x - x.préc.courr.x);
        //console.log('x = ' + x.n + ' tmp = ' + tmp.pair + ' ' + tmp.impair)
        //console.log(calcColPoint(a, x.courr, true))
        return (tmp.impair == undefined) ?
            { pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } }, courr: calcColPoint(a, x.courr, true) } } :
            {
                pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } }, courr: calcColPoint(a, x.courr, true) },
                impair: { n: tmp.impair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } }, courr: calcColPoint(a, x.courr, false) }
            };
    }
    var collatzRender = function (x, w) {
        collatzStep.ctxG.moveTo(x.pair.préc.courr.x, x.pair.préc.courr.y);
        collatzStep.ctxG.lineTo(x.pair.courr.x, x.pair.courr.y);
        collatzStep.ctxG.stroke();
        collatzStep.ctxG.beginPath();
        /*ctxG.arc(x.pair.courr.x, x.pair.courr.y, w / 2, 0, 2 * Math.PI);
        ctxG.arc(x.pair.préc.courr.x, x.pair.préc.courr.y, w / 2, 0, 2 * Math.PI);
        ctxG.fill()
        ctxG.beginPath();*/
        //ctxG.stroke()
        if (x.impair != undefined) {
            /*ctxG.stroke()
            ctxG.beginPath();
            ctxG.arc(x.impair.courr.x, x.impair.courr.y, w / 2, 0, 2 * Math.PI);
            ctxG.fill()
            ctxG.beginPath();*/
            collatzStep.ctxG.moveTo(x.impair.préc.courr.x, x.impair.préc.courr.y);
            collatzStep.ctxG.lineTo(x.impair.courr.x, x.impair.courr.y);
            //ctxG.stroke()
        }
        return x;
    };
    var testAffBig = function (i, width) {
        if (width === void 0) { width = (function (x) {
            collatzStep.ctxG.beginPath();
            collatzStep.ctxG.strokeStyle = collatzStep.ctxG.fillStyle = 'hsla(270, 40%, 30%,' + 1 + ')';
            collatzStep.ctxG.rect(0, 0, 2500, 1500);
            collatzStep.ctxG.fill();
            collatzStep.ctxG.beginPath();
            collatzStep.ctxG.lineCap = "round";
            collatzStep.ctxG.lineWidth = x;
            //ctxG.shadowColor = 'hsla(90, 100%, 0%,' + 1 + ')'; ctxG.shadowBlur = 20
            return x;
        })(20); }
        return function () {
            return i = i.map(function (_a, i) {
                var pair = _a.pair, impair = _a.impair, d = _a.d;
                console.log(pair.courr);
                if (i % 200 == 0) {
                    collatzStep.ctxG.stroke();
                    collatzStep.ctxG.beginPath();
                }
                //console.log(pair)
                if (d > 3) {
                    return [];
                }
                else if (impair == undefined) {
                    return [__assign({}, collatzRender((collatzAff(pair)), width), { d: d + 0.75 })];
                }
                else
                    return [__assign({}, collatzRender((collatzAff(pair)), width), { d: d }), __assign({}, collatzRender((collatzAff(impair)), width), { d: d - 1 })];
            } //
            ).reduce(function (acc, x) {
                if (x.length != 0)
                    acc.push(x[0]);
                if (x.length == 2)
                    acc.push(x[1]);
                return acc;
            }, (function (x) { collatzStep.ctxG.stroke(); collatzStep.ctxG.beginPath(); collatzStep.ctxG.lineWidth = (width -= 0.20); collatzStep.ctxG.shadowColor = collatzStep.ctxG.strokeStyle = collatzStep.ctxG.fillStyle = 'hsla(90, ' + width * 5 + '%, ' + (130 - (width * 5)) + '%,' + 1 + ')'; return []; })());
        };
    };
    collatzStep.testAff = testAffBig([__assign({}, collatzRender({ pair: { n: 1, préc: { n: 0, préc: { n: -1 }, courr: point(2000, 800) }, courr: point(900, 800) } }, 30), { d: 0 })]);
})(collatzStep || (collatzStep = {}));
var drawStep = function () { return collatzStep.testAff(); };
function completeRender() {
    var ctxG = collatzFun.ctxG;
    ctxG.beginPath();
    ctxG.lineCap = "round";
    collatzFun.collatzOpti(collatzFun.point(900, 850), 180 * Math.PI / 180, 2, 170, 0, 15, function (x) { ctxG.lineWidth = x; ctxG.strokeStyle = 'hsl(0,50%,' + 100 / x + '%)'; });
    ctxG.closePath();
}
