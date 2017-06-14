//import { compose } from '@typed/compose';
/**
 * tool box for programming
 */
namespace tools {
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
    export function compose(...args: ((x: any) => any)[]): (...x: any[]) => any {
        var fns = arguments;

        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                result = fns[i].call(this, result);
            }

            return result;
        };
    };

    /**
     * same as compose
     * but in reverse, so apply left to right
     * @param args functions that are composable
     * @return composed function
     */
    export let composeReverse = (...args: ((x: any) => any)[]): (...x: any[]) => any => {
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
}


namespace collatzFun {
    //--------------------Types-----------------------
    type Point = { x: number, y: number }
    type degré = number
    type gradient = number
    type angle = degré | gradient
    type Render = CanvasRenderingContext2D
    type Tracé = { précèdent?: Tracé, courrant: Point, ctx: Render }
    type canvas = HTMLCanvasElement
    //------------------------------------------------

    //-----------------global variables---------------
    /** the canvas rendering object */
    export const ctxG: Render = (document.getElementById('renderingCanvas') as canvas).getContext('2d')
    //------------------------------------------------

    //-------------------point factory----------------
    /**
     * create a 2d point structure
     * @param x x-coordinate or abscissa
     * @param y y-coordinate or ordinate
     * @return { x: x, y: y }
     */
    export function point(x: number, y: number): Point { return { x: x, y: y } }
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
    function lineTo(t: Tracé, p: Point): Tracé {
        t.ctx.lineTo(p.x, p.y)
        return { ...t, précèdent: t, courrant: p }
    }
    function lineToComp(p: Point) {
        return (t: Tracé): Tracé => {
            t.ctx.lineTo(p.x, p.y)
            return { ...t, précèdent: t, courrant: p }
        }
    }
    //little test to avoid return and ;
    let lineTo_LOL = (t: Tracé, p: Point): Tracé => (x => ({ ...t, précèdent: t, courrant: p }))(t.ctx.moveTo(p.x, p.y))

    //.......stroke line........
    function endDétaillé(t: Tracé): Point[] {
        t.ctx.stroke()
        function f(x: Tracé): Point[] {
            return (t.précèdent === undefined) ?
                [] :
                [x.courrant, ...f(t.précèdent)]
        }
        return f(t)
    }

    let end = (t: Tracé): Render => { t.ctx.stroke(); return t.ctx }

    //......init line
    let start = (c: canvas, p: Point, apparence?: (ctx: Render) => void): Tracé => {
        let ctx = ctxG
        ctx.moveTo(p.x, p.y)
        return { courrant: p, ctx: ctx }
    } //TODO gérer le | null

    let startComp = (p: Point, apparence?: (ctx: Render) => void) => (ctx: Render): Tracé => {
        if (apparence != undefined) apparence(ctx)
        ctx.moveTo(p.x, p.y)
        return { courrant: p, ctx: ctx }
    } //TODO gérer le | null

    let pointArr2TracéConstructor = (c: canvas) => ([s, ...l]: Point[]): Tracé =>
        tools.composeReverse(startComp(s), ...l.map(x => lineToComp(x)), end)(c)

    let trace = (p1: Point, p2: Point) =>
        (ctx: Render): Render => {
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
            return ctx
        }

    let multi = (t: Tracé, l: Point[]): Tracé[] =>
        l.map(p => {
            trace(t.courrant, p)
            return { ...t, précèdent: t, courrant: p }
        });


    let multiComp = ([p, ...l]: Point[]) => (t: Tracé): Tracé[] =>
        l.map(p => {
            trace(t.courrant, p)
            return { ...t, précèdent: t, courrant: p }
        });

    let multiSimpleComp = ([p, ...l]: Point[]) => (t: Tracé): Tracé[] =>
        l.map(p => {
            //trace(t.courrant, p)
            return { ...t, précèdent: t, courrant: p, ctx: trace(t.courrant, p)(t.ctx) }
        });

    type Tcollatz = { pair: TcollatzRec, impair?: TcollatzRec }
    type TcollatzRec = { suivant?: Tcollatz, courrant: number }
    type collatzCoor = { n: number, préc: collatzCoor, courr: Point }

    let collatzInv = (x: number): { pair: number, impair?: number } =>
        (((2 * x - 1) % 3 != 0 || x == 2) ?
            { pair: 2 * x } :
            { pair: 2 * x, impair: (2 * x - 1) / 3 })
    //console.log(collatzInv(20))
    /*              courrant,  limite     */
    let recTest = (n: number, l: number): TcollatzRec => {
        if (l == 0) return { courrant: n }
        var tmp = collatzInv(n)
        return (tmp.impair == undefined) ?
            { courrant: n, suivant: { pair: recTest(tmp.pair, l - 1) } } :
            { courrant: n, suivant: { pair: recTest(tmp.pair, l - 1), impair: recTest(tmp.impair, l - 1) } }
    }

    export let collatzRec = (n = 1): TcollatzRec =>
        ((tmp: { pair: number, impair?: number }) =>
            (tmp.impair == undefined) ?
                { courrant: n, suivant: { pair: collatzRec(tmp.pair) } } :
                { courrant: n, suivant: { pair: collatzRec(tmp.pair), impair: collatzRec(tmp.impair) } }
        )(collatzInv(n))

    /*let calcColPointBig = (d: angle, long: number) => (a: angle, c: Point, pair: boolean) =>
        (pair) ?
            point(c.x + long * Math.cos(a + d), c.y + long * Math.sin(a + d)) :
            point(c.x + long * Math.cos(a - d), c.y + long * Math.sin(a - d))

    let calcColPoint = calcColPointBig(0.15, 30)*/
    function calcColPointBig(d: angle, long: number) {
        return function innner(a: angle, c: Point, pair: boolean) {
            //d /= 1.005
            long /= 1.0001
            return (pair) ?
                point(c.x + long * Math.cos(a + d), c.y + long * Math.sin(a + d)) :
                point(c.x + long * Math.cos(a - d), c.y + long * Math.sin(a - d))
        }
    }
    let calcColPoint = calcColPointBig(0.6, 10)

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
    function collatzAff(x: collatzCoor): { pair: collatzCoor, impair?: collatzCoor } {
        const tmp = collatzInv(x.n)
        const a = Math.atan2(x.courr.y - x.préc.courr.y, x.courr.x - x.préc.courr.x)
        //console.log('x = ' + x.n + ' tmp = ' + tmp.pair + ' ' + tmp.impair)
        //console.log(calcColPoint(a, x.courr, true))
        return (tmp.impair == undefined) ?
            { pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } } as collatzCoor, courr: calcColPoint(a, x.courr, true) } } :
            {
                pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } } as collatzCoor, courr: calcColPoint(a, x.courr, true) },
                impair: { n: tmp.impair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } } as collatzCoor, courr: calcColPoint(a, x.courr, false) }
            }
    }
    const abord: number = 7
    export function collatzOpti(p: Point, a: angle, n: number, l: number, b: number, w: number, f): void {
        f(w)
        if (l > 0) {
            let tmp = collatzInv(n)
            if (tmp.impair != undefined) {
                let p_tmp = calcColPoint(a, p, false)
                ctxG.moveTo(p.x, p.y)
                ctxG.lineTo(p_tmp.x, p_tmp.y)
                collatzOpti(
                    p_tmp,
                    Math.atan2(p_tmp.y - p.y, p_tmp.x - p.x),
                    tmp.impair, l - 1, Math.abs(b - 2),
                    w / 1.02, f)
            }
            if (b < abord) {
                let p_tmp = calcColPoint(a, p, true)
                ctxG.moveTo(p.x, p.y)
                ctxG.lineTo(p_tmp.x, p_tmp.y)
                collatzOpti(
                    p_tmp,
                    Math.atan2(p_tmp.y - p.y, p_tmp.x - p.x),
                    tmp.pair, l - 1, b + 2,
                    w / 1.02, f)
            } else { ctxG.stroke(); ctxG.beginPath() }
        } else { ctxG.stroke(); ctxG.beginPath() }

    }

}

namespace collatzStep {


    type Point = { x: number, y: number }
    type degré = number
    type gradient = number
    type angle = degré | gradient
    type Tracé = { précèdent?: Tracé, courrant: Point, canvas: canvas, ctx: CanvasRenderingContext2D }
    type canvas = HTMLCanvasElement
    type Render = CanvasRenderingContext2D

    export const ctxG: Render = (document.getElementById('renderingCanvas') as canvas).getContext('2d')//add warn


    let point = (x: number, y: number): Point => ({ x: x, y: y })


    type Tcollatz = { pair: TcollatzRec, impair?: TcollatzRec }
    type TcollatzRec = { suivant?: Tcollatz, courrant: number }
    type collatzCoor = { n: number, préc: collatzCoor, courr: Point }

    let collatzInv = (x: number): { pair: number, impair?: number } =>
        (((2 * x - 1) % 3 != 0 || x == 2) ?
            { pair: 2 * x } :
            { pair: 2 * x, impair: (2 * x - 1) / 3 })
    //console.log(collatzInv(20))
    /*         courrant,  limite     */
    let rec = (n: number, l: number): TcollatzRec => {
        if (l == 0) return { courrant: n }
        var tmp = collatzInv(n)
        return (tmp.impair == undefined) ?
            { courrant: n, suivant: { pair: rec(tmp.pair, l - 1) } } :
            { courrant: n, suivant: { pair: rec(tmp.pair, l - 1), impair: rec(tmp.impair, l - 1) } }
    }

    export let collatzRec = (n = 1): TcollatzRec =>
        ((tmp: { pair: number, impair?: number }) =>
            (tmp.impair == undefined) ?
                { courrant: n, suivant: { pair: collatzRec(tmp.pair) } } :
                { courrant: n, suivant: { pair: collatzRec(tmp.pair), impair: collatzRec(tmp.impair) } }
        )(collatzInv(n))

    /*let calcColPointBig = (d: angle, long: number) => (a: angle, c: Point, pair: boolean) =>
        (pair) ?
            point(c.x + long * Math.cos(a + d), c.y + long * Math.sin(a + d)) :
            point(c.x + long * Math.cos(a - d), c.y + long * Math.sin(a - d))

    let calcColPoint = calcColPointBig(0.15, 30)*/
    function calcColPointBig(d: angle, long: number) {
        return function innner(a: angle, c: Point, pair: boolean) {
            d -= 0.00001//d /= 1.0001
            long /= 1.0001
            return (pair) ?
                point(c.x + long * Math.cos(a + d * 1.2) * 3, c.y + long * Math.sin(a + d * 1.2 /*+ Math.random() / 100*/) * 3) :
                point(c.x + long * Math.cos(a - d * 1.6) * 3, c.y + long * Math.sin(a - d * 1.6) * 3)
        }
    }

    let calcColPoint = calcColPointBig(0.3, 5)

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
    function collatzAff(x: collatzCoor): { pair: collatzCoor, impair?: collatzCoor } {
        const tmp = collatzInv(x.n)
        const a = Math.atan2(x.courr.y - x.préc.courr.y, x.courr.x - x.préc.courr.x)
        //console.log('x = ' + x.n + ' tmp = ' + tmp.pair + ' ' + tmp.impair)
        //console.log(calcColPoint(a, x.courr, true))
        return (tmp.impair == undefined) ?
            { pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } } as collatzCoor, courr: calcColPoint(a, x.courr, true) } } :
            {
                pair: { n: tmp.pair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } } as collatzCoor, courr: calcColPoint(a, x.courr, true) },
                impair: { n: tmp.impair, préc: { courr: x.courr, n: x.n, préc: { n: x.préc.n } } as collatzCoor, courr: calcColPoint(a, x.courr, false) }
            }
    }



    let collatzRender = (x: { pair: collatzCoor, impair?: collatzCoor }, w: number): { pair: collatzCoor, impair?: collatzCoor } => {
        ctxG.moveTo(x.pair.préc.courr.x, x.pair.préc.courr.y)
        ctxG.lineTo(x.pair.courr.x, x.pair.courr.y)
        ctxG.stroke()
        ctxG.beginPath();
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
            ctxG.moveTo(x.impair.préc.courr.x, x.impair.préc.courr.y)
            ctxG.lineTo(x.impair.courr.x, x.impair.courr.y)
            //ctxG.stroke()
        }
        return x
    }

    let testAffBig = (i: {
        pair: {
            n: number;
            préc: collatzCoor;
            courr: {
                x: number;
                y: number;
            };
        };
        impair?: {
            n: number;
            préc: collatzCoor;
            courr: {
                x: number;
                y: number;
            };
        };
        d: number
    }[], width = (x => {
        ctxG.beginPath();
        ctxG.strokeStyle = ctxG.fillStyle = 'hsla(270, 40%, 30%,' + 1 + ')';
        ctxG.rect(0, 0, 2500, 1500)
        ctxG.fill()
        ctxG.beginPath();
        ctxG.lineCap = "round";
        ctxG.lineWidth = x;
        //ctxG.shadowColor = 'hsla(90, 100%, 0%,' + 1 + ')'; ctxG.shadowBlur = 20
        return x
    })(20)) => () =>
            i = i.map(({ pair, impair, d }: { pair: collatzCoor, impair?: collatzCoor, d: number }, i) => {
                console.log(pair.courr)
                if (i % 200 == 0) { ctxG.stroke(); ctxG.beginPath() }
                //console.log(pair)
                if (d > 3) {
                    return []
                } else if (impair == undefined) {
                    return [{ ...collatzRender((collatzAff(pair)), width), d: d + 0.75 }]
                } else return [{ ...collatzRender((collatzAff(pair)), width), d: d }, { ...collatzRender((collatzAff(impair)), width), d: d - 1 }]


            }//
            ).reduce((acc, x) => {//acc.concat(x) 
                if (x.length != 0) acc.push(x[0])
                if (x.length == 2) acc.push(x[1])
                return acc
            }, ((x) => { ctxG.stroke(); ctxG.beginPath(); ctxG.lineWidth = (width -= 0.20); ctxG.shadowColor = ctxG.strokeStyle = ctxG.fillStyle = 'hsla(90, ' + width * 5 + '%, ' + (130 - (width * 5)) + '%,' + 1 + ')'; return [] })())

    export let testAff = testAffBig([{ ...collatzRender({ pair: { n: 1, préc: { n: 0, préc: { n: -1 } as collatzCoor, courr: point(2000, 800) }, courr: point(900, 800) } }, 30), d: 0 }])
}


let drawStep = () => collatzStep.testAff();

function completeRender() {
    let ctxG = collatzFun.ctxG
    ctxG.beginPath(); ctxG.lineCap = "round"
    collatzFun.collatzOpti(
        collatzFun.point(900, 850), 180 * Math.PI / 180, 2, 170, 0, 15,
        x => { ctxG.lineWidth = x; ctxG.strokeStyle = 'hsl(0,50%,' + 100 / x + '%)' })
    ctxG.closePath();
}

