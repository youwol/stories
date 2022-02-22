import * as grapesjs from 'grapesjs'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { CodeEditorState, CodeEditorView } from '../editor.view'
import { popupModal } from '../editor.modal'
import { script } from './script'
import { HeaderView } from './editor-header.view'

const codeMirrorConfiguration = {
    value: '',
    mode: 'javascript',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: true,
    indentUnit: 4,
}

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

const componentType = 'custom-view'

export function customViewComponent(editor: grapesjs.Editor) {
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
                dblclick: 'editSrc',
            },
            editSrc: () => {
                const component = editor.getSelected()
                if (!component.getAttributes().src) {
                    component.addAttributes({ src: defaultSrc })
                }
                const src$ = new BehaviorSubject(component.getAttributes().src)
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
                combineLatest([src$, headerView.run$]).subscribe(([src, _]) => {
                    component && component.addAttributes({ src })
                    component.view.render()
                })
            },
        },
    })
}
