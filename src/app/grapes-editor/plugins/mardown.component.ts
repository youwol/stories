import * as grapesjs from 'grapesjs'
import CodeMirror from 'codemirror'

import { child$, HTMLElement$, render, VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, merge, ReplaySubject, Subject } from 'rxjs'
import { fetchCodeMirror$ } from '../../utils/cdn-fetch'
import { popupEmojisBrowserModal } from '../../modals/emojis-picker.view'
import { Modal } from '@youwol/fv-group'

export function markdownComponent(editor: grapesjs.Editor) {
    const script = function () {
        window['contextId'] = 'grapesj_iframe'
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
                click: 'clickOnElement',
                dblclick: 'editMarkdown',
            },
            clickOnElement: () => {
                console.log('On click')
            },
            editMarkdown: () => {
                const component = editor.getSelected()
                const initialContent = component.getAttributes().content
                popupModal(initialContent).subscribe((content) => {
                    component && component.addAttributes({ content })
                    component.view.render()
                })
            },
            onRender({ el }) {
                const btn = document.createElement('button')
                btn.value = '+'
                el.appendChild(btn)
            },
        },
    })
}

/**
 * Editor view
 */
export class EditorView implements VirtualDOM {
    static codeMirror$ = fetchCodeMirror$()
    public readonly class = 'd-flex flex-column fv-text-primary'
    public readonly content$: BehaviorSubject<string>

    public readonly children: Array<VirtualDOM>

    public readonly emojis$ = new Subject<string>()

    public readonly configurationCodeMirror = {
        value: '',
        mode: 'markdown',
        lineNumbers: true,
        theme: 'blackboard',
        lineWrapping: true,
        indentUnit: 4,
    }

    /**
     * This editor gets initialized after the required assets
     * have been fetched from the CDN
     */
    public readonly codeMirrorEditor$ = new ReplaySubject<CodeMirror.Editor>(1)

    constructor(params: { content$: BehaviorSubject<string> }) {
        Object.assign(this, params)

        this.children = [
            this.headerView(),
            {
                class: 'w-100',
                style: {
                    height: '50vh',
                },
                children: [
                    child$(EditorView.codeMirror$, () => {
                        return {
                            id: 'code-mirror-editor',
                            class: 'w-100 h-100',
                            connectedCallback: (elem: HTMLElement$) => {
                                const config = {
                                    ...this.configurationCodeMirror,
                                    value: this.content$.getValue(),
                                }
                                const editor: CodeMirror.Editor = window[
                                    'CodeMirror'
                                ](elem, config)
                                editor.on('changes', (_, changeObj) => {
                                    if (
                                        changeObj.length == 1 &&
                                        changeObj[0].origin == 'setValue'
                                    ) {
                                        return
                                    }
                                    this.content$.next(editor.getValue())
                                })

                                elem.ownSubscriptions(
                                    this.emojis$.subscribe((text) => {
                                        const doc = editor.getDoc()
                                        const cursor = doc.getCursor()
                                        doc.replaceRange(text, cursor)
                                    }),
                                )
                                this.codeMirrorEditor$.next(editor)
                            },
                        }
                    }),
                ],
            },
        ]
    }

    headerView() {
        return {
            children: [
                {
                    class: 'd-flex w-100 align-items-center',
                    children: [
                        {
                            tag: 'i',
                            class: 'fv-pointer rounded m-1 fas fa-smile editor-view-header-emoji',
                            onclick: () =>
                                popupEmojisBrowserModal(this.emojis$),
                        },
                    ],
                },
            ],
        }
    }
}

function popupModal(content: string) {
    const content$ = new BehaviorSubject(content)
    const editor = new EditorView({ content$ })
    const modalState = new Modal.State()
    const view = new Modal.View({
        state: modalState,
        contentView: () => {
            return {
                class: 'p-3 rounded fv-color-primary fv-bg-background w-75 h-75 overflow-auto',
                children: [editor],
            }
        },
        connectedCallback: (elem: HTMLDivElement & HTMLElement$) => {
            elem.children[0].classList.add('w-100')
            const sub = merge(modalState.cancel$, modalState.ok$).subscribe(
                () => {
                    modalDiv.remove()
                },
            )
            elem.ownSubscriptions(sub)
        },
    } as any)
    const modalDiv = render(view)
    document.querySelector('body').appendChild(modalDiv)
    return content$
}
