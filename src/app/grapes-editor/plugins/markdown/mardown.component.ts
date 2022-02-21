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

export function markdownComponent(editor: grapesjs.Editor) {
    const tagName = 'markdown'
    editor.DomComponents.addType('markdown-editor', {
        extendFn: ['initialize'],
        isComponent: (el: HTMLElement) => {
            return el.tagName.toLowerCase() == tagName
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
                tagName,
                droppable: false,
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
