import * as Dockable from '../../common/dockable-tabs/dockable-tabs.view'
import { CssEditor, JsEditor } from './code-editors'
import { AppState } from '../app-state'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorView } from '../code-editor/code-editor.view'
import { Code } from '../models'

export class CssBottomNavTab extends Dockable.Tab {
    constructor(params: { appState: AppState }) {
        super({
            id: 'css',
            title: 'CSS',
            icon: 'fab fa-css3',
            content: () => {
                return new CssEditor({
                    ...params,
                    content$: new BehaviorSubject<string>(
                        params.appState.globalCss$.getValue(),
                    ),
                    onRun: (content) =>
                        params.appState.applyGlobals({ css: content }),
                })
            },
        })
    }
}

export class JsBottomNavTab extends Dockable.Tab {
    constructor(params: { appState: AppState }) {
        super({
            id: 'js',
            title: 'Javascript',
            icon: 'fab fa-js-square',
            content: () => {
                return new JsEditor({
                    ...params,
                    content$: new BehaviorSubject<string>(
                        params.appState.globalJavascript$.getValue(),
                    ),
                    onRun: (content) => {
                        params.appState.applyGlobals({ javascript: content })
                    },
                })
            },
        })
    }
}

export class ComponentsBottomNavTab extends Dockable.Tab {
    constructor(params: { appState: AppState }) {
        super({
            id: 'blocks',
            title: 'Blocks',
            icon: 'fas fa-shapes',
            content: () => {
                return new JsEditor({
                    ...params,
                    content$: new BehaviorSubject<string>(
                        params.appState.globalComponents$.getValue(),
                    ),
                    onRun: (content) => {
                        params.appState.applyGlobals({ components: content })
                    },
                })
            },
        })
    }
}

export class CodePropertyEditorBottomNavTab extends Dockable.Tab {
    constructor(params: { appState: AppState; code: Code }) {
        super({
            id: 'code-property-editor',
            title: 'Property',
            icon: 'fas fa-code',
            content: () => {
                return new CodeEditorView(params)
            },
        })
    }
}
