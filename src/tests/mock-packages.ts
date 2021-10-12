import { of } from "rxjs"
import { EditorState, EditorView } from "../app/main-panels/document-editor/editor/editor.view"

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
    EditorState.codeMirror$ = () => of(CodeMirror) 
    EditorState.debounceTime = 0
    
    window['CodeMirror'] = (elem, content) => new CodeMirror(elem,content)
    window['marked'] = (innerHTML) => {
        return  `<div class='marked' > ${innerHTML} </div>` 
    }
    window['MathJax'] = {
        typesetPromise : (elements: HTMLElement[]) => {
            elements.forEach( elem => elem.classList.add('mathjax'))
            return Promise.resolve()
        }
    }
}
