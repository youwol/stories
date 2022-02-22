export function script() {
    const defaultSrc = `
return async ({cdn}) => {
    const {fluxView, rxjs} = await cdn.install({ 
        modules: ['@youwol/flux-view'],
        aliases: { fluxView: "@youwol/flux-view" }
    })
    const vDOM = {
         innerText: 'hello world'
    }
    return fluxView.render(vDOM)
}`

    this.innerHTML = ``
    const src = this.getAttribute('src') || defaultSrc
    window['cdn'] = window['@youwol/cdn-client']
    const htmlPromise = new Function(src)()(window)
    htmlPromise.then((html) => this.appendChild(html))
}
