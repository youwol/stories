// eslint-disable-next-line eslint-comments/disable-enable-pair -- to not have problem
/* eslint-disable jest/no-done-callback -- eslint-comment It is required because */

import { installMockPackages } from './mock-packages'
import { AppState, load$ } from '../app/main-app/app-state'
import { EditorView } from '../app/main-panels/document-editor/editor/editor.view'
import { setupMockService } from '../app/utils/mock-service'
import { storiesUnitTests } from './mock-data/database'
import { TopBanner } from '@youwol/platform-essentials'
import { RenderView } from '../app/main-panels/document-editor/render/render.view'
import { ViewMode } from '../app/main-app/top-banner'

installMockPackages()

setupMockService(storiesUnitTests, true)

const storyId = 'test-story'
AppState.debounceTimeSave = 1

test('load story, ensure readonly ok', (done) => {
    load$(storyId, document.body).subscribe(({ appState }) => {
        // WHEN application is loaded ...

        // EXPECT - 0 : no write permissions (readonly)
        expect(appState.permissions.write).toBeFalsy()

        // EXPECT - 1 : tree-view with node 'test-story' is displayed
        const storyView = document.getElementById('test-story')
        expect(storyView).toBeTruthy()

        // EXPECT - 2 : editor view is not displayed by default in readonly
        let editorView = document.getElementById(
            'editor-view',
        ) as any as EditorView
        expect(editorView).toBeFalsy()

        // EXPECT - 3 : editor view is not displayed by default in readonly
        const renderView = document.getElementById(
            'render-view',
        ) as any as RenderView
        expect(renderView).toBeTruthy()

        // EXPECT - 4 : banner is displayed
        const bannerView = document.querySelector(
            `.${TopBanner.YouwolBannerView.ClassSelector}`,
        )
        expect(bannerView).toBeTruthy()

        // EXPECT - 5 : locked icon is displayed
        const lockedView = bannerView.querySelector('.locked')
        expect(lockedView).toBeTruthy()

        // WHEN trigger edit-only mode
        const customActionsView = document.querySelector('.custom-actions-view')
        const editOnlyView = customActionsView.querySelector(
            `.${ViewMode.editOnly}`,
        )
        expect(editOnlyView).toBeTruthy()
        editOnlyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT editor view
        editorView = document.getElementById('editor-view') as any as EditorView
        expect(editorView).toBeTruthy()
        editorView.codeMirrorEditor$.subscribe((editor) => {
            expect(editor.readonly).toBeTruthy()
            done()
        })
    })
})
