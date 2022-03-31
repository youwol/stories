import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState } from './code-editor/code-editor.view'
import { CodeRequirements } from '../common'

export interface Code {
    headerView: (state: CodeEditorState) => VirtualDOM
    content$: BehaviorSubject<string>
    configuration
    requirements: CodeRequirements
}
