import * as grapesjs from 'grapesjs'

import { BehaviorSubject } from 'rxjs'
import { CodeEditorState } from '../../../code-editor/code-editor.view'
import { script } from './script'
import { MarkDownHeaderView } from './editor-header.view'
import { AppState } from '../../../main-app/app-state'

const codeMirrorConfiguration = {
    value: '',
    mode: 'markdown',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: true,
    indentUnit: 4,
}
const componentType = 'markdown-editor'
export function markdownComponent(appState: AppState, editor: grapesjs.Editor) {
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
                        label: 'parse latex equations',
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
                appState.editCode({
                    headerView: (state: CodeEditorState) =>
                        new MarkDownHeaderView({ state }),
                    content$: src$,
                    configuration: codeMirrorConfiguration,
                    requirements: {
                        scripts: [
                            'codemirror#5.52.0~mode/javascript.min.js',
                            'codemirror#5.52.0~mode/markdown.min.js',
                            'codemirror#5.52.0~mode/css.min.js',
                            'codemirror#5.52.0~mode/xml.min.js',
                            'codemirror#5.52.0~mode/htmlmixed.min.js',
                            'codemirror#5.52.0~mode/gfm.min.js',
                        ],
                        css: [],
                    },
                })
                src$.subscribe((src) => {
                    component && component.addAttributes({ src })
                    component.view.render()
                })
            },
        },
    })
}
