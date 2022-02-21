export function script() {
    this.innerHTML = ``
    const src = this.getAttribute('src') || '# Dbl click to edit'
    const useMathjax = this.getAttribute('mathjax') != null
    const parse = () => {
        this.innerHTML = window.marked(src)
        if (useMathjax) {
            const MathJax = window['MathJax']
            Promise.resolve().then(() => {
                MathJax.typesetPromise([this])
            })
        }
    }
    if (
        (!useMathjax && window.marked) ||
        (useMathjax && window.marked && window['MathJax'])
    ) {
        parse()
        return
    }
    const cdnClient = window['@youwol/cdn-client']
    cdnClient
        .install({
            modules: [
                ...['marked', 'highlight.js'],
                ...(useMathjax ? ['mathjax'] : []),
            ],
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
