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
    editor.DomComponents.addType('markdown-editor', {
        isComponent: (el: HTMLElement) => {
            return (
                el.tagName == 'DIV' &&
                el.classList.contains('grapes-markdown-editor')
            )
        },
        model: {
            defaults: {
                script,
                tagName: 'div',
                droppable: false,
                attributes: {
                    class: 'grapes-markdown-editor',
                },
                traits: [
                    {
                        type: 'text',
                        name: 'content',
                        label: 'Content',
                        value: '# Start',
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

                const content$ = new BehaviorSubject(
                    component.getAttributes().content,
                )
                const state = new CodeEditorState({
                    codeMirrorConfiguration,
                    content$,
                })
                const headerView = new MarkDownHeaderView({ state })
                const editorView = new CodeEditorView({
                    headerView,
                    state,
                    content$,
                })
                popupModal({ editorView })
                content$.subscribe((content) => {
                    component && component.addAttributes({ content })
                    component.view.render()
                })
            },
        },
    })
}
