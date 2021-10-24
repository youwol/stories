
export class CodeMirror {

    events = {
    }
    value: string
    constructor(public readonly elem: HTMLDivElement, content: { value: string }) {
        elem.innerHTML = `<div id='CodeMirror'> ${content.value} </div>`
        this.value = content.value
    }
    on(changeType, callback) {
        this.events[changeType] = callback
    }
    setValue(content) {
        this.value = content
        this.elem.innerHTML = `<div id='CodeMirror'> ${content} </div>`
        this.events["changes"](undefined, [{ origin: "setValue" }])
    }
    changeValue(content) {
        this.value = content
        this.elem.innerHTML = `<div id='CodeMirror'> ${content} </div>`
        this.events["changes"](undefined, [{ origin: "changeValue" }])
    }
    getValue() {
        return this.value
    }
}

export function installMockPackages() {

    window['@youwol/cdn-client'] = {
        fetchBundles: () => {
            return Promise.resolve({})
        },
        fetchStyleSheets: () => {
            return Promise.resolve({})
        },
        fetchJavascriptAddOn: () => {
            return Promise.resolve({})
        },
    }

    window['CodeMirror'] = (elem, content) => new CodeMirror(elem, content)

    window['MathJax'] = {
        typesetPromise: (elements: HTMLElement[]) => {
            elements.forEach(elem => elem.classList.add('mathjax'))
            return Promise.resolve()
        }
    }
    let cdnScript = document.createElement('script')
    cdnScript.src = "/fake-cdn-url-for-unit-tests"
    cdnScript.id = "cdn-client"
    let bootstrapLink = document.createElement('link')
    bootstrapLink.id = "bootstrap"
    let fvLink = document.createElement('link')
    fvLink.id = "fv"
    let faLink = document.createElement('link')
    faLink.id = "fa"

    document.head.appendChild(cdnScript)
    document.head.appendChild(bootstrapLink)
    document.head.appendChild(fvLink)
    document.head.appendChild(faLink)
}
