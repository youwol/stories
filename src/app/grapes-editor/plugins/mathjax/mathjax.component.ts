import * as grapesjs from 'grapesjs'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState, CodeEditorView } from '../editor.view'
import { popupModal } from '../editor.modal'
import { script } from './script'

const codeMirrorConfiguration = {
    value: '',
    mode: 'markdown',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: true,
    indentUnit: 4,
}
const componentType = 'mathjax-editor'

export function mathjaxComponent(editor: grapesjs.Editor) {
    editor.DomComponents.addType(componentType, {
        isComponent: (el: HTMLElement) => {
            return (
                el.getAttribute &&
                el.getAttribute('componentType') == componentType
            )
        },
        model: {
            defaults: {
                script,
                tagName: 'div',
                droppable: false,
                attributes: {
                    componentType,
                },
            },
        },
        view: {
            events: {
                dblclick: 'editLatext',
            },
            editLatext: () => {
                const component = editor.getSelected()
                if (!component.getAttributes().src) {
                    component.addAttributes({ src: '\\Huge{e^{i\\pi}+1=0}' })
                }
                const src$ = new BehaviorSubject(component.getAttributes().src)
                const state = new CodeEditorState({
                    codeMirrorConfiguration,
                    content$: src$,
                })
                const editorView = new CodeEditorView({
                    state,
                    content$: src$,
                })
                popupModal({ editorView })
                src$.subscribe((src) => {
                    component && component.addAttributes({ src })
                    component.view.render()
                })
            },
        },
    })
}
