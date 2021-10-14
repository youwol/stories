// (index.html is handled by HtmlWebpackPlugin)
require('./style.css')
export{}

let cdn = window['@youwol/cdn-client']

let stylesFutures = cdn.fetchStyleSheets([
    "bootstrap#4.4.1~bootstrap.min.css",
    "fontawesome#5.12.1~css/all.min.css",
    "highlight.js#11.2.0~styles/default.min.css",
    "@youwol/fv-widgets#0.0.3~dist/assets/styles/style.youwol.css"
])

let bundlesFutures = cdn.fetchBundles(
    {
        'lodash': '4.17.15',
        "rxjs": '6.5.5',
        "@youwol/flux-core": 'latest',
        '@youwol/flux-view': 'latest',
        "@youwol/fv-group": "latest",
        "@youwol/fv-button": "latest",
        "@youwol/fv-tree": "latest",
        "@youwol/fv-tabs": "latest",
        "@youwol/fv-input": "latest",
        "@youwol/fv-context-menu": "latest",
        "@youwol/flux-fv-widgets": "latest",
        "marked": "latest",
        "mathjax": "latest",
        "highlight.js": "11.2.0"
    },
    window
)

await Promise.all([stylesFutures, bundlesFutures])

await import('./load-app')


