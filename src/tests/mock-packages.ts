//import { EditorState } from "../app/main-panels/document-editor/editor/editor.view"


export class CodeMirror{
    
    events = {
    }
    value: string
    constructor(elem: HTMLDivElement, content: {value: string}){
        elem.innerHTML = `<div id='CodeMirror'> ${content.value} </div>`
        this.value = content.value
    }
    on( changeType, callback){
        this.events[changeType] = callback
    }
    setValue(content){
        this.value = content
        this.events["changes"]()
    }
    getValue(){
        return this.value
    }
}

export function installMockPackages(){

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
    
    window['CodeMirror'] = (elem, content) => new CodeMirror(elem,content)
    
    window['MathJax'] = {
        typesetPromise : (elements: HTMLElement[]) => {
            elements.forEach( elem => elem.classList.add('mathjax'))
            return Promise.resolve()
        }
    }
}
