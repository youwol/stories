export function script() {
    this.innerHTML = ``
    const src = this.getAttribute('src') || '\\Huge{e^{i\\pi}+1=0}'
    const parse = () => {
        const MathJax = window['MathJax']
        Promise.resolve().then(() => {
            this.innerHTML = `$$${src}$$`
            MathJax.typesetPromise([this])
        })
    }
    if (window['MathJax']) {
        parse()
        return
    }
    const cdnClient = window['@youwol/cdn-client']
    cdnClient
        .install({
            modules: ['mathjax'],
        })
        .then(() => {
            parse()
        })
}
