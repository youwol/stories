
const runTimeDependencies = {
    "load": {
        "@youwol/os-core": "^0.1.0",
        "@youwol/fv-tree": "^0.2.0",
        "@youwol/os-top-banner": "^0.1.0",
        "@youwol/cdn-client": "^1.0.0",
        "@youwol/http-clients": "^1.0.0",
        "@youwol/flux-view": "^1.0.0",
        "@youwol/fv-context-menu": "^0.1.0",
        "rxjs": "^6.5.5",
        "grapesjs": "0.18.3"
    },
    "differed": {
        "codemirror": "^5.52.0"
    },
    "includedInBundle": []
}
const externals = {
    "@youwol/os-core": "window['@youwol/os-core_APIv01']",
    "@youwol/fv-tree": "window['@youwol/fv-tree_APIv02']",
    "@youwol/os-top-banner": "window['@youwol/os-top-banner_APIv01']",
    "@youwol/cdn-client": "window['@youwol/cdn-client_APIv1']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv1']",
    "@youwol/flux-view": "window['@youwol/flux-view_APIv1']",
    "@youwol/fv-context-menu": "window['@youwol/fv-context-menu_APIv01']",
    "rxjs": "window['rxjs_APIv6']",
    "grapesjs": "window['grapesjs_APIv018']",
    "codemirror": "window['CodeMirror_APIv5']",
    "rxjs/operators": "window['rxjs_APIv6']['operators']"
}
const exportedSymbols = {
    "@youwol/os-core": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/os-core"
    },
    "@youwol/fv-tree": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-tree"
    },
    "@youwol/os-top-banner": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/os-top-banner"
    },
    "@youwol/cdn-client": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/cdn-client"
    },
    "@youwol/http-clients": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/flux-view": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/flux-view"
    },
    "@youwol/fv-context-menu": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/fv-context-menu"
    },
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    },
    "grapesjs": {
        "apiKey": "018",
        "exportedSymbol": "grapesjs"
    },
    "codemirror": {
        "apiKey": "5",
        "exportedSymbol": "CodeMirror"
    }
}
export const setup = {
    name:'@youwol/stories',
        assetId:'QHlvdXdvbC9zdG9yaWVz',
    version:'0.2.0',
    shortDescription:"YouWol Stories application",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/stories',
    npmPackage:'https://www.npmjs.com/package/@youwol/stories',
    sourceGithub:'https://github.com/youwol/stories',
    userGuide:'https://l.youwol.com/doc/@youwol/stories',
    apiVersion:'02',
    runTimeDependencies,
    externals,
    exportedSymbols
}

export function getExportedSymbolName(module:string){
    return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
}
