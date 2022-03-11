import * as grapesjs from 'grapesjs'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState } from '../../../code-editor/code-editor.view'
import { script } from './script'
import { HeaderView } from '../custom-view/editor-header.view'
import { withLatestFrom } from 'rxjs/operators'
import { AppState } from '../../../main-app/app-state'

const codeMirrorConfiguration = {
    value: '',
    mode: 'markdown',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: true,
    indentUnit: 4,
}
const componentType = 'mathjax-editor'

export function mathjaxComponent(appState: AppState, editor: grapesjs.Editor) {
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
                appState.editCode({
                    headerView: (state: CodeEditorState) => {
                        const headerView = new HeaderView({ state })
                        headerView.run$
                            .pipe(withLatestFrom(src$))
                            .subscribe(([_, src]) => {
                                component && component.addAttributes({ src })
                                component.view.render()
                            })
                        return headerView
                    },
                    content$: src$,
                    configuration: codeMirrorConfiguration,
                    requirements: {
                        scripts: [
                            'codemirror#5.52.0~mode/javascript.min.js',
                            'codemirror#5.52.0~mode/css.min.js',
                            'codemirror#5.52.0~mode/xml.min.js',
                            'codemirror#5.52.0~mode/htmlmixed.min.js',
                            //'codemirror#5.52.0~mode/gfm.min.js',
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
