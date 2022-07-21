import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState } from './code-editor'
import { CodeRequirements } from '../common'

/**
 * @category Data Structure
 */
export interface Code {
    headerView: (state: CodeEditorState) => VirtualDOM
    content$: BehaviorSubject<string>
    configuration
    requirements: CodeRequirements
}
