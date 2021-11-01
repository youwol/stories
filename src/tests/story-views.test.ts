
import { installMockPackages } from './mock-packages'
installMockPackages()

import { load$ } from "../app/main-app/app-state"
import { EditorView } from "../app/main-panels/document-editor/editor/editor.view"
import { RenderView } from "../app/main-panels/document-editor/render/render.view"
import { setupMockService } from "../app/utils/mock-service"
import { contentYouwolView } from "./mock-data/test-story-youwol-view"
import { sanitizeCodeScript, StoryView } from "../app/main-panels/document-editor/render/renderers"
import { storiesUnitTests } from './mock-data/database'
import { doc } from 'prettier'
import { render } from '@youwol/flux-view'

setupMockService(storiesUnitTests)

let storyId = 'test-story'

test("unit test StoryView with direct HTMLElement returned", (done) => {

    let code = `
return () => {
    let div = document.createElement('div')
    div.id = "test-direct-htmlelement"
    div.innerHTML='unit test YouWol view'
    return div
}
`
    // WHEN a story view with HTML element returned ...
    let view = new StoryView(code)
    view.resolveView(window, document.body)
    // EXPECT the element to be inserted
    let div = document.getElementById("test-direct-htmlelement")
    expect(div).toBeTruthy()
    done()
})


test("unit test StoryView with direct HTMLElement returned with options", (done) => {

    let code = `
return () => {
    let div = document.createElement('div')
    div.innerHTML='unit test YouWol view'
    div.id = "test-direct-htmlelement-with-options"
    return {
        view: div,
        options: { 
            wrapper: {
                class:"test", 
                style:{width:'50px'}
            }
        }
    }
}
`
    // WHEN a story view with HTML & options returned ...
    let view = new StoryView(code)
    view.resolveView(window, document.body)

    // EXPECT the element to be inserted
    let div = document.getElementById("test-direct-htmlelement-with-options")
    expect(div).toBeTruthy()

    // EXPECT the wrapper to be modified
    expect(document.body.classList.contains("test")).toBeTruthy()
    expect(document.body.style.getPropertyValue('width')).toEqual('50px')
    done()
})


test("unit test StoryView promise on HTMLElement returned", (done) => {

    let code = `
return () => {
    let div = document.createElement('div')
    div.innerHTML='unit test YouWol view'
    div.id = "test-promise-htmlelement"
    return Promise.resolve(div)
}
`

    // WHEN a story view with a promise on HTML returned ...
    let view = new StoryView(code)
    view.resolveView(window, document.body).then(
        () => {
            // EXPECT the element to be inserted at promise resolution
            let div = document.getElementById("test-promise-htmlelement")
            expect(div).toBeTruthy()
            done()
        }
    )
})


test("unit test StoryView and swapping with mode", (done) => {

    function expectVisible(elem: Element) {
        expect(elem.classList.contains("d-none")).toBeFalsy()
    }
    function expectNotVisible(elem: Element) {
        expect(elem.classList.contains("d-none")).toBeTruthy()
    }

    document.body.innerHTML = ""
    let code = `
return () => {
    let div = document.createElement('div')
    return div
}
`
    // WHEN a story view is inserted
    let view = new StoryView(code)
    document.body.appendChild(render(view))

    // EXPECT by default the iframe view
    let iframeView = document.querySelector(".story-view .iframe-view")
    expect(iframeView).toBeTruthy()

    // EXPECT by default not the code view
    let codeView = document.querySelector(".story-view .code-view")
    expect(codeView).toBeFalsy()

    // WHEN switch to code view triggered
    let switchToCode = document.querySelector(".story-view .menu-view .mode-code")
    expect(switchToCode).toBeTruthy()
    switchToCode.dispatchEvent(new Event('click', { bubbles: true }))

    // EXPECT code view visible
    codeView = document.querySelector(".story-view .code-view")
    expect(codeView).toBeTruthy()
    expectVisible(codeView)

    // EXPECT iframe view not visible
    iframeView = document.querySelector(".story-view .iframe-view")
    expectNotVisible(iframeView)

    // WHEN switch to iframe view triggered
    let switchToIFrame = document.querySelector(".story-view .menu-view .mode-iframe")
    expect(switchToIFrame).toBeTruthy()
    switchToIFrame.dispatchEvent(new Event('click', { bubbles: true }))

    // EXPECT iframe view visible
    iframeView = document.querySelector(".story-view .iframe-view")
    expectVisible(iframeView)

    // EXPECT code view not visible
    codeView = document.querySelector(".story-view .code-view")
    expectNotVisible(codeView)

    done()
})


test('load story, expand root  node, select a document with flux-views', (done) => {
    RenderView.debounceTime = 0
    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN application is loaded ...
            // EXPECT tree-view with node 'test-story' is displayed
            let storyView = document.getElementById("test-story")
            expect(storyView).toBeTruthy()

            // WHEN the test-story node is expanded
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT its children are displayed
            let docViews = Array.from(document.querySelectorAll('.document'))
            expect(docViews.length).toEqual(3)

            // WHEN a child is expanded (contentYouWol)
            docViews[2].dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT - 1: the content of the code mirror editor displayed 'contentYouwolView'
            let editorView = document.getElementById("editor-view") as any as EditorView
            expect(editorView).toBeTruthy()

            editorView.codeMirrorEditor$.subscribe(() => {
                let innerTextCodeMirror = document.getElementById("CodeMirror").innerHTML
                expect(sanitizeCodeScript(innerTextCodeMirror).trim()).toEqual(contentYouwolView.trim())
            })

            // EXPECT - 2 the content of the renderer view display the virtual DOM loaded from 'contentYouwolView'
            let renderView = document.getElementById("render-view") as any as RenderView
            renderView.renderedElement$.subscribe(({ document, htmlElement }) => {
                expect(document.documentId).toEqual('test-story-youwol-view')
                // There is one correctly formatted code
                let youwolView = htmlElement.querySelector("#test-youwol-view")
                // Seems that encapsulation in iframe do not allow testing
                //expect(youwolView).toBeTruthy()
                //expect(youwolView.innerHTML).toEqual("Test YouWol View")

                // And another one with error
                let errorView = htmlElement.querySelector(".youwol-view-error .message")
                expect(errorView).toBeTruthy()

                done()
            })
        })
})

