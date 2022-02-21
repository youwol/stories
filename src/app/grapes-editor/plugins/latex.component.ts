import * as grapesjs from 'grapesjs'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState, CodeEditorView } from './editor.view'
import { popupModal } from './editor.modal'

const codeMirrorConfiguration = {
    value: '',
    mode: 'markdown',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: true,
    indentUnit: 4,
}

export function latexComponent(editor: grapesjs.Editor) {
    const script = function () {
        this.innerHTML = ``

        const parse = () => {
            const MathJax = window['MathJax']
            Promise.resolve().then(() => {
                this.innerHTML = `$$${this.attributes.content.nodeValue}$$`
                MathJax.typesetPromise([this])
            })
        }
        if (window['MathJax']) {
            parse()
            return
        }
        const cdnClient = window['@youwol/cdn-client']
        cdnClient
            .install({
                modules: ['mathjax'],
            })
            .then(() => {
                console.log('MathJax', window['MathJax'])
                parse()
            })
    }

    editor.DomComponents.addType('latex-editor', {
        isComponent: (el: HTMLElement) => {
            return (
                el.tagName == 'DIV' &&
                el.classList.contains('grapes-latex-editor')
            )
        },
        model: {
            defaults: {
                script,
                tagName: 'div',
                droppable: false,
                attributes: {
                    class: 'grapes-latex-editor',
                },
                traits: [
                    {
                        type: 'text',
                        name: 'content',
                        value: 'x = 2',
                    },
                ],
            },
        },
        view: {
            events: {
                dblclick: 'editLatext',
            },
            editLatext: () => {
                const component = editor.getSelected()

                const content$ = new BehaviorSubject(
                    component.getAttributes().content,
                )
                const state = new CodeEditorState({
                    codeMirrorConfiguration,
                    content$,
                })
                const editorView = new CodeEditorView({
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
