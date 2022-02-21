export function script() {
    const defaultSrc = `
return ({cdn}) => {

    return cdn
        .install({ 
        modules: ['@youwol/flux-view'],
        aliases: { 
            fluxView: "@youwol/flux-view"
        }
    })
        .then( ({fluxView, rxjs}) => {  

        let vDOM = {
             innerText: 'hello world'
         }
        return fluxView.render(vDOM) 
    })\t
}`

    this.innerHTML = ``
    const src = this.getAttribute('src') || defaultSrc
    window['cdn'] = window['@youwol/cdn-client']
    const htmlPromise = new Function(src)()(window)
    htmlPromise.then((html) => this.appendChild(html))
}
