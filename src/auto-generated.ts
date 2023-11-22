
const runTimeDependencies = {
    "externals": {
        "@youwol/os-core": "^0.1.5",
        "@youwol/fv-tree": "^0.2.3",
        "@youwol/os-top-banner": "^0.1.1",
        "@youwol/cdn-client": "^2.0.4",
        "@youwol/http-clients": "^2.0.3",
        "@youwol/http-primitives": "^0.1.2",
        "@youwol/flux-view": "^1.0.4",
        "@youwol/fv-context-menu": "^0.1.1",
        "rxjs": "^6.5.5",
        "grapesjs": "^0.20.4",
        "codemirror": "^5.52.0"
    },
    "includedInBundle": {}
}
const externals = {
    "@youwol/os-core": "window['@youwol/os-core_APIv01']",
    "@youwol/fv-tree": "window['@youwol/fv-tree_APIv02']",
    "@youwol/os-top-banner": "window['@youwol/os-top-banner_APIv01']",
    "@youwol/cdn-client": "window['@youwol/cdn-client_APIv2']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv2']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv01']",
    "@youwol/flux-view": "window['@youwol/flux-view_APIv1']",
    "@youwol/fv-context-menu": "window['@youwol/fv-context-menu_APIv01']",
    "rxjs": "window['rxjs_APIv6']",
    "grapesjs": "window['grapesjs_APIv020']",
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
        "apiKey": "2",
        "exportedSymbol": "@youwol/cdn-client"
    },
    "@youwol/http-clients": {
        "apiKey": "2",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/http-primitives"
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
        "apiKey": "020",
        "exportedSymbol": "grapesjs"
    },
    "codemirror": {
        "apiKey": "5",
        "exportedSymbol": "CodeMirror"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./index.ts",
    "loadDependencies": [
        "@youwol/os-core",
        "@youwol/fv-tree",
        "@youwol/os-top-banner",
        "@youwol/cdn-client",
        "@youwol/http-clients",
        "@youwol/http-primitives",
        "@youwol/flux-view",
        "@youwol/fv-context-menu",
        "rxjs",
        "grapesjs"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@youwol/stories': './index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/stories/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/stories',
        assetId:'QHlvdXdvbC9zdG9yaWVz',
    version:'0.2.9',
    shortDescription:"YouWol Stories application",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/stories&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@youwol/stories',
    sourceGithub:'https://github.com/youwol/stories',
    userGuide:'https://l.youwol.com/doc/@youwol/stories',
    apiVersion:'02',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/stories_APIv02`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/stories#0.2.9~dist/@youwol/stories/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/stories/${entry.name}_APIv02`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
