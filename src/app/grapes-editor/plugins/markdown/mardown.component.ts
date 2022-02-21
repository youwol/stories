import * as grapesjs from 'grapesjs'

import { BehaviorSubject } from 'rxjs'
import { CodeEditorState, CodeEditorView } from '../editor.view'
import { popupModal } from '../editor.modal'
import { script } from './script'
import { MarkDownHeaderView } from './editor-header.view'

const codeMirrorConfiguration = {
    value: '',
    mode: 'markdown',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: true,
    indentUnit: 4,
}
const componentType = 'markdown-editor'
export function markdownComponent(editor: grapesjs.Editor) {
    editor.DomComponents.addType(componentType, {
        extendFn: ['initialize'],
        isComponent: (el: HTMLElement) => {
            return (
                el.getAttribute &&
                el.getAttribute('componentType') == componentType
            )
        },
        model: {
            initialize() {
                const attributes = this.getAttributes()
                console.log(attributes)

                this.on('change:attributes:mathjax', () => {
                    this.view.render()
                })
            },
            defaults: {
                script,
                tagName: 'div',
                droppable: false,
                attributes: {
                    componentType,
                },
                traits: [
                    {
                        type: 'checkbox',
                        name: 'mathjax',
                        label: 'parse tex equations',
                        value: false,
                    },
                ],
            },
        },
        view: {
            events: {
                dblclick: 'editMarkdown',
            },
            editMarkdown: () => {
                const component = editor.getSelected()
                if (!component.getAttributes().src) {
                    component.addAttributes({ src: '# Title' })
                }
                const src$ = new BehaviorSubject(component.getAttributes().src)
                const state = new CodeEditorState({
                    codeMirrorConfiguration,
                    content$: src$,
                })
                const headerView = new MarkDownHeaderView({ state })
                const editorView = new CodeEditorView({
                    headerView,
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
