// eslint-disable-next-line eslint-comments/disable-enable-pair -- to not have problem
/* eslint-disable jest/no-done-callback -- eslint-comment It is required because */

import { installMockPackages } from './mock-packages'
import { AppState } from '../app/main-app/app-state'
import { EditorView } from '../app/main-panels/document-editor/editor/editor.view'
import { RenderView } from '../app/main-panels/document-editor/render/render.view'
import { setupMockService } from '../app/utils/mock-service'
import { storiesUnitTests } from './mock-data/database'
import { ViewMode } from '../app/main-app/top-banner'
import { load$ } from '../app/main-app/utils'

installMockPackages()

setupMockService(storiesUnitTests)

const storyId = 'test-story'
AppState.debounceTimeSave = 1

test('load story, switch between mode', (done) => {
    load$(storyId, document.body).subscribe(() => {
        // WHEN application is loaded ...
        // EXPECT - 1 : tree-view with node 'test-story' is displayed
        const storyView = document.getElementById('test-story')
        expect(storyView).toBeTruthy()

        // EXPECT - 2 : editor view is displayed
        let editorView = document.getElementById(
            'editor-view',
        ) as any as EditorView
        expect(editorView).toBeTruthy()

        // EXPECT - 3 : render view is displayed
        let renderView = document.getElementById(
            'render-view',
        ) as any as RenderView
        expect(renderView).toBeTruthy()

        // EXPECT - 4 : custom actions displayed in top-banner
        const customActionsView = document.querySelector('.custom-actions-view')
        expect(customActionsView).toBeTruthy()

        // WHEN trigger edit-only mode
        const editOnlyView = customActionsView.querySelector(
            `.${ViewMode.editOnly}`,
        )
        expect(editOnlyView).toBeTruthy()
        editOnlyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT no more render view
        renderView = document.getElementById('render-view') as any as RenderView
        expect(renderView).toBeFalsy()

        // WHEN trigger edit-only mode
        const renderOnlyView = customActionsView.querySelector(
            `.${ViewMode.renderOnly}`,
        )
        expect(renderOnlyView).toBeTruthy()
        renderOnlyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT no more editor view
        editorView = document.getElementById('editor-view') as any as EditorView
        expect(editorView).toBeFalsy()

        // WHEN trigger dual mode
        const dualView = customActionsView.querySelector(
            `.${ViewMode.simultaneous}`,
        )
        expect(dualView).toBeTruthy()
        dualView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT editor & renders views displayed
        editorView = document.getElementById('editor-view') as any as EditorView
        expect(editorView).toBeTruthy()
        renderView = document.getElementById('render-view') as any as RenderView
        expect(renderView).toBeTruthy()

        done()
    })
})
