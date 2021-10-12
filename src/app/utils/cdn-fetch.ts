import { fetchBundles, fetchJavascriptAddOn, fetchStyleSheets } from "@youwol/cdn-client"
import { from, Observable } from "rxjs"
import { share } from "rxjs/operators"


let urlsJs = [
    "codemirror#5.52.0~mode/javascript.min.js",
    "codemirror#5.52.0~mode/markdown.min.js",
    "codemirror#5.52.0~mode/css.min.js",
    "codemirror#5.52.0~mode/xml.min.js",
    "codemirror#5.52.0~mode/htmlmixed.min.js",
    "codemirror#5.52.0~mode/gfm.min.js"
]
let urlsCss = [
    "codemirror#5.52.0~codemirror.min.css",
    "codemirror#5.52.0~theme/blackboard.min.css"
]

/**
 * Fetches code mirror's assets.
 * 
 * @returns an observable that resolves when fetching is achieved
 */
export function fetchCodeMirror$(): Observable<any> {
    let css = fetchStyleSheets(urlsCss)
    let jsCode = fetchBundles({
        codemirror: {
            version: '5.52.0',
            sideEffects: () => ({ })
        }
    }, window)
        .then(() => fetchJavascriptAddOn(urlsJs, window))
    return from(Promise.all([jsCode, css])).pipe(
        share()
    )
}