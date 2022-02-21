import * as grapesjs from 'grapesjs'

import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, combineLatest, Subject } from 'rxjs'
import { popupEmojisBrowserModal } from '../../modals/emojis-picker.view'
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

export function markdownComponent(editor: grapesjs.Editor) {
    const script = function () {
        this.innerHTML = `parsing(${this.attributes.content.nodeValue})`

        const parse = () => {
            this.innerHTML = window.marked(this.attributes.content.nodeValue)
        }
        if (window.marked) {
            parse()
            return
        }
        const cdnClient = window['@youwol/cdn-client']
        cdnClient
            .install({
                modules: ['marked', 'highlight.js'],
                css: [
                    {
                        resource: 'highlight.js#11.2.0~styles/default.min.css',
                        domId: 'highlight',
                    },
                ],
            })
            .then(() => {
                window.marked.setOptions({
                    langPrefix: 'hljs language-',
                    highlight: function (code, lang) {
                        return window['hljs'].highlightAuto(code, [lang]).value
                    },
                })
                parse()
            })
    }

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
                components: 'Example',
                traits: [
                    'name',
                    'placeholder',
                    { type: 'checkbox', name: 'required' },
                    {
                        type: 'string',
                        name: 'content',
                        value: '# Start',
                    },
                ],
                'script-props': ['content'],
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

export class MarkDownHeaderView {
    public readonly state: CodeEditorState
    public readonly emojis$ = new Subject<string>()
    public readonly children: VirtualDOM[]
    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    constructor(params: { state: CodeEditorState }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'd-flex w-100 align-items-center',
                children: [
                    {
                        tag: 'i',
                        class: 'fv-pointer rounded m-1 fas fa-smile editor-view-header-emoji',
                        onclick: () => popupEmojisBrowserModal(this.emojis$),
                    },
                ],
            },
        ]
        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            elem.ownSubscriptions(
                combineLatest([
                    this.state.codeMirrorEditor$,
                    this.emojis$,
                ]).subscribe(([cm, emoji]) => {
                    const doc = cm.getDoc()
                    const cursor = doc.getCursor()
                    doc.replaceRange(emoji, cursor)
                }),
            )
        }
    }
}
