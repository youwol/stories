import { from, Observable } from "rxjs"
import { share } from "rxjs/operators"


/**
 * 
 * @param params :
 * -    bundles: e.g. { codemirror: '5.52.0'} ; 'latest' can be used
 * -    urlsJsAddons: list of javascript script url to be fetched after
 * the bundles have been fetched. Default to [].
 * -    urlCss: list of css urls to fetch. Default to [].
 * @returns 
 */
 export function fetchResources$( params: {
     bundles : {[key:string] : string },
     urlsJsAddOn : string [],
     urlsCss : string [],
 }): Observable<any> {

    // This is to provide a handle to inject a mock cdn for unit tests,
    // a better solution will come using a proper environment
    // It is equivalent to 'import * as cdn from "@youwol/cdn-client"'
    let cdn = window["@youwol/cdn-client"]
    let css = cdn.fetchStyleSheets(params.urlsCss)

    let jsCode = cdn.fetchBundles(params.bundles, window)
        .then((bundles) => 
            cdn.fetchJavascriptAddOn(params.urlsJsAddOn, window)
            .then( jsAddOns => ({bundles, jsAddOns})))

    return from(Promise.all([jsCode, css])).pipe(
        share()
    )
}

/**
 * Fetches code mirror's assets.
 * 
 * @returns an observable that resolves when fetching is achieved
 */
export function fetchCodeMirror$(): Observable<any> {

    return fetchResources$({
        bundles: { codemirror: '5.52.0'},
        urlsJsAddOn: [
            "codemirror#5.52.0~mode/javascript.min.js",
            "codemirror#5.52.0~mode/markdown.min.js",
            "codemirror#5.52.0~mode/css.min.js",
            "codemirror#5.52.0~mode/xml.min.js",
            "codemirror#5.52.0~mode/htmlmixed.min.js",
            "codemirror#5.52.0~mode/gfm.min.js"
        ],
        urlsCss:[
            "codemirror#5.52.0~codemirror.min.css",
            "codemirror#5.52.0~theme/blackboard.min.css"
        ]
    })
}