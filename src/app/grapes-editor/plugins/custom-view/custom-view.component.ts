import * as grapesjs from 'grapesjs'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState } from '../../../code-editor/code-editor.view'
import { script } from './script'
import { HeaderView } from './editor-header.view'
import { withLatestFrom } from 'rxjs/operators'
import { AppState } from '../../../main-app/app-state'

const codeMirrorConfiguration = {
    value: '',
    mode: 'javascript',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: false,
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

export function customViewComponent(
    appState: AppState,
    editor: grapesjs.Editor,
) {
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
            },
        },
    })
}
