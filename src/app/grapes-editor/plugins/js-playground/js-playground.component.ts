import * as grapesjs from 'grapesjs'

import { render } from './script'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState, CodeEditorView } from '../editor.view'
import { HeaderView } from './editor-header.view'
import { popupModal } from '../editor.modal'
import { withLatestFrom } from 'rxjs/operators'

const componentType = 'js-playground'
const defaultSrc = `
return async ({debug}) => {
    
    const jsObject = { 
        title: 'hello js playground!'
    }
    debug({title: 'jsObject', data: jsObject})
    
    const div = document.createElement('div')
    div.innerText = "I'm an html div"
    div.classList.add('fv-text-focus', 'text-center', 'p-1', 'border', 'rounded')
    debug({title: 'htmlElement', data: div})
    
    return true
}
`
const defaultTest = `
return async (result, {expect}) => {
    expect("A dummy passing test", true)
    return true
}
`

const codeMirrorConfiguration = {
    value: '',
    mode: 'javascript',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: true,
    indentUnit: 4,
}

export function jsPlaygroundComponent(editor: grapesjs.Editor) {
    function editCode(srcAttName) {
        const component = editor.getSelected()
        if (!component.getAttributes()[srcAttName]) {
            component.addAttributes({ [srcAttName]: defaultSrc })
        }
        const src$ = new BehaviorSubject<string>(
            component.getAttributes()[srcAttName],
        )
        const state = new CodeEditorState({
            codeMirrorConfiguration,
            content$: src$,
        })
        const headerView = new HeaderView({ state })
        const editorView = new CodeEditorView({
            state,
            content$: src$,
            headerView,
        })
        popupModal({ editorView })
        headerView.run$.pipe(withLatestFrom(src$)).subscribe(([_, src]) => {
            component && component.addAttributes({ [srcAttName]: src })
            console.log('Save attr', component)
            component.view.render()
        })
    }

    editor.DomComponents.addType(componentType, {
        extendFn: ['initialize'],
        isComponent: (el: HTMLElement) => {
            return (
                el.getAttribute &&
                el.getAttribute('componentType') == componentType
            )
        },
        model: {
            defaults: {
                script: render,
                droppable: false,
                attributes: {
                    componentType,
                },
                traits: [
                    {
                        name: 'editSrc',
                        label: 'edit source',
                        type: 'button',
                        text: 'Click me',
                        full: true, // Full width button
                        command: (editor) => {
                            const component = editor.getSelected()
                            if (!component.getAttributes().src) {
                                component.addAttributes({ src: defaultSrc })
                            }
                            editCode('src')
                        },
                    },
                    {
                        name: 'editTest',
                        label: 'edit test',
                        type: 'button',
                        text: 'Click me',
                        full: true, // Full width button
                        command: (editor) => {
                            const component = editor.getSelected()
                            if (!component.getAttributes()['src-test']) {
                                component.addAttributes({
                                    'src-test': defaultTest,
                                })
                            }
                            editCode('src-test')
                        },
                    },
                ],
            },
            initialize() {
                /*no op for now*/
            },
        },
    })
}
