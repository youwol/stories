export function script() {
    this.innerHTML = ``
    const src = this.getAttribute('src') || '# Dbl click to edit'
    const parse = () => {
        this.innerHTML = window.marked(src)
    }
    if (window.marked) {
        parse()
        return
    }
    const cdnClient = window['@youwol/cdn-client']
    cdnClient
        .install({
            modules: ['marked', 'highlight.js'],
            css: [
                {
                    resource: 'highlight.js#11.2.0~styles/default.min.css',
                    domId: 'highlight',
                },
            ],
        })
        .then(() => {
            window.marked.setOptions({
                langPrefix: 'hljs language-',
                highlight: function (code, lang) {
                    return window['hljs'].highlightAuto(code, [lang]).value
                },
            })
            parse()
        })
}
