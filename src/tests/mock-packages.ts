export class CodeMirror {
    events = {}
    value: string
    readonly: boolean

    constructor(
        public readonly elem: HTMLDivElement,
        content: { value: string; readOnly: boolean },
    ) {
        elem.innerHTML = `<div id='CodeMirror'> ${content.value} </div>`
        this.value = content.value
        this.readonly = content.readOnly
    }

    on(changeType, callback) {
        this.events[changeType] = callback
    }

    setValue(content) {
        this.value = content
        this.elem.innerHTML = `<div id='CodeMirror'> ${content} </div>`
        this.events['changes'](undefined, [{ origin: 'setValue' }])
    }

    changeValue(content) {
        this.value = content
        this.elem.innerHTML = `<div id='CodeMirror'> ${content} </div>`
        this.events['changes'](undefined, [{ origin: 'changeValue' }])
    }

    getValue() {
        return this.value
    }

    replacedRanges = []

    getDoc() {
        return {
            getCursor: () => 0,
            replaceRange: (text, cursor) => {
                this.replacedRanges.push({ text, cursor })
            },
        }
    }
}

export function installMockPackages() {
    window['CodeMirror'] = (elem, content) => new CodeMirror(elem, content)

    window['MathJax'] = {
        typesetPromise: (elements: HTMLElement[]) => {
            elements.forEach((elem) => elem.classList.add('mathjax'))
            return Promise.resolve()
        },
    }
}

// fetch & Request are mocked just to provide the signedIn$ ok signal in the top-banner
/*
class Request {
    constructor() { }
}
let fetch = () => of({ status: 200 })

export function installMockPackages() {

    (window as any)['fetch'] = fetch;
    (window as any)['Request'] = Request

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
        install: () => {
            return Promise.resolve({})
        }
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
*/
