// eslint-disable-next-line eslint-comments/disable-enable-pair -- to not have problem
/* eslint-disable jest/no-done-callback -- eslint-comment It is required because */

import { installMockPackages } from './mock-packages'
import { load$ } from '../app/main-app/app-state'
import { EditorView } from '../app/main-panels/document-editor/editor/editor.view'
import { RenderView } from '../app/main-panels/document-editor/render/render.view'
import { setupMockService } from '../app/utils/mock-service'
import { contentYouwolView } from './mock-data/test-story-youwol-view'
import {
    sanitizeCodeScript,
    StoryView,
} from '../app/main-panels/document-editor/render/renderers'
import { storiesUnitTests } from './mock-data/database'
import { render, VirtualDOM } from '@youwol/flux-view'

installMockPackages()

setupMockService(storiesUnitTests)

const storyId = 'test-story'

test('unit test StoryView with direct HTMLElement returned', (done) => {
    document.body.innerHTML = ''

    const code = `
return () => {
    let div = document.createElement('div')
    div.id = "test-direct-htmlelement"
    div.innerHTML='unit test YouWol view'
    return div
}
`
    // WHEN a story view with HTML element returned ...
    const view = new StoryView(code)
    view.resolveView(window, document.body)
    // EXPECT the element to be inserted
    const div = document.getElementById('test-direct-htmlelement')
    expect(div).toBeTruthy()
    done()
})

test('unit test StoryView with direct error', (done) => {
    document.body.innerHTML = ''
    const code = `
return () => {
    let div = document.createElement('div')
    div.id  "test-direct-htmlelement"
    div.innerHTML='unit test YouWol view'
    return div
}
`
    // WHEN a story view with HTML element returned ...
    const view = new StoryView(code)
    view.resolveView(window, document.body)
    // EXPECT the element to be inserted
    const div = document.querySelector('.story-view-error')
    expect(div).toBeTruthy()
    const stacks = Array.from(document.querySelectorAll('.story-view-error li'))
    expect(stacks.length).toBeGreaterThan(0)
    done()
})

test('unit test StoryView with direct HTMLElement returned with options', (done) => {
    document.body.innerHTML = ''

    const code = `
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
            },
            defaultMode: 'dual'
        }
    }
}
`
    // WHEN a story view with HTML & options returned ...
    const view = new StoryView(code)
    view.resolveView(window, document.body)

    // EXPECT the element to be inserted
    const div = document.getElementById('test-direct-htmlelement-with-options')
    expect(div).toBeTruthy()

    // EXPECT the wrapper to be modified
    expect(document.body.classList.contains('test')).toBeTruthy()
    expect(document.body.style.getPropertyValue('width')).toBe('50px')

    // EXPECT the mode to be dual
    expect(view.mode$.getValue()).toBe('dual')

    done()
})

test('unit test StoryView with direct HTMLElement returned with options', (done) => {
    class TestStoryViewComponent implements VirtualDOM {
        class = 'TestStoryViewComponent'
        innerText = 'TestStoryViewComponent'

        renderStoryView() {
            return render(this)
        }
    }

    window['cdn'] = window['@youwol/cdn-client']
    window['cdn'].install = () => {
        window['@youwol/story-views'] = { TestStoryViewComponent }
        return Promise.resolve(window)
    }

    document.body.innerHTML = ''

    const code = `
return {
	package:'@youwol/story-views',
    view:"TestStoryViewComponent",
    parameters: {
        name:"@youwol/flux-view",
        licence:"MIT"
    }
}
`
    // WHEN a story view with HTML & options returned ...
    const view = new StoryView(code)

    view.resolveView(window, document.body).then(() => {
        const div = document.querySelector('.TestStoryViewComponent')
        expect(div).toBeTruthy()
        expect(div['innerText']).toBe('TestStoryViewComponent')
        done()
    })
})

test('unit test StoryView promise on HTMLElement returned', (done) => {
    document.body.innerHTML = ''

    const code = `
return () => {
    let div = document.createElement('div')
    div.innerHTML='unit test YouWol view'
    div.id = "test-promise-htmlelement"
    return Promise.resolve(div)
}
`

    // WHEN a story view with a promise on HTML returned ...
    const view = new StoryView(code)
    view.resolveView(window, document.body).then(() => {
        // EXPECT the element to be inserted at promise resolution
        const div = document.getElementById('test-promise-htmlelement')
        expect(div).toBeTruthy()
        done()
    })
})

test('unit test StoryView promise on with error, no stack available', (done) => {
    document.body.innerHTML = ''

    const code = `
return () => {
    let div = document.createElement('div')
    div.innerHTML='unit test YouWol view'
    div.id = "test-promise-htmlelement"
    return new Promise((resolve, reject) => {
        throw 'Uh-oh!';
      });
      
}
`
    // WHEN a story view with a promise containing an error ...
    const view = new StoryView(code)
    view.resolveView(window, document.body).then(() => {
        // EXPECT an error view displayed
        const div = document.querySelector('.story-view-error')
        expect(div).toBeTruthy()
        done()
    })
})

test('unit test StoryView with cdn install step', (done) => {
    let rendered = false
    window['cdn'] = window['@youwol/cdn-client']
    window['cdn'].install = () => {
        window['@youwol/flux-view'] = { render: () => (rendered = true) }
        window['fluxView'] = window['@youwol/flux-view']
        return Promise.resolve(window)
    }

    document.body.innerHTML = ''

    const code = `
return ({cdn}) => 
    installFluxView(cdn)
    .then( () => ({
        view: fluxView.render(),
        options: {
            defaultMode: 'dual'
        }
    }))
`
    const view = new StoryView(code)
    view.resolveView(window, document.body).then(() => {
        expect(rendered).toBeTruthy()
        done()
    })
    done()
})

test('unit test StoryView and swapping with mode', (done) => {
    document.body.innerHTML = ''

    function expectVisible(elem: Element) {
        expect(elem.classList.contains('d-none')).toBeFalsy()
    }

    document.body.innerHTML = ''
    const code = `
return () => {
    let div = document.createElement('div')
    return div
}
`
    // WHEN a story view is inserted
    const view = new StoryView(code)
    document.body.appendChild(render(view))

    // EXPECT by default the iframe view
    let iframeView = document.querySelector('.story-view .iframe-view')
    expect(iframeView).toBeTruthy()

    // EXPECT by default not the code view
    let codeView = document.querySelector('.story-view .code-view')
    expect(codeView).toBeFalsy()

    // WHEN switch to code view triggered
    const switchToCode = document.querySelector(
        '.story-view .menu-view .mode-code',
    )
    expect(switchToCode).toBeTruthy()
    switchToCode.dispatchEvent(new Event('click', { bubbles: true }))

    // EXPECT code view visible
    codeView = document.querySelector('.story-view .code-view')
    expect(codeView).toBeTruthy()
    expectVisible(codeView)

    // EXPECT iframe view not visible
    iframeView = document.querySelector('.story-view .iframe-view')
    expect(iframeView).toBeFalsy()

    // WHEN switch to iframe view triggered
    const switchToIFrame = document.querySelector(
        '.story-view .menu-view .mode-iframe',
    )
    expect(switchToIFrame).toBeTruthy()
    switchToIFrame.dispatchEvent(new Event('click', { bubbles: true }))

    // EXPECT iframe view visible
    iframeView = document.querySelector('.story-view .iframe-view')
    expectVisible(iframeView)

    // EXPECT code view not visible
    codeView = document.querySelector('.story-view .code-view')
    expect(codeView).toBeFalsy()

    // WHEN switch to dual view triggered
    const switchToDual = document.querySelector(
        '.story-view .menu-view .mode-dual',
    )
    expect(switchToDual).toBeTruthy()
    switchToDual.dispatchEvent(new Event('click', { bubbles: true }))

    // EXPECT iframe view visible
    iframeView = document.querySelector('.story-view .iframe-view')
    expectVisible(iframeView)

    // EXPECT code view visible
    codeView = document.querySelector('.story-view .code-view')
    expectVisible(codeView)

    done()
})

test('load story, expand root  node, select a document with flux-views', (done) => {
    document.body.innerHTML = ''

    RenderView.debounceTime = 0
    load$(storyId, document.body).subscribe(() => {
        // WHEN application is loaded ...
        // EXPECT tree-view with node 'test-story' is displayed
        const storyView = document.getElementById('test-story')
        expect(storyView).toBeTruthy()

        // WHEN the test-story node is expanded
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT its children are displayed
        const docViews = Array.from(document.querySelectorAll('.document'))
        expect(docViews).toHaveLength(3)

        // WHEN a child is expanded (contentYouWol)
        docViews[2].dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT - 1: the content of the code mirror editor displayed 'contentYouwolView'
        const editorView = document.getElementById(
            'editor-view',
        ) as any as EditorView
        expect(editorView).toBeTruthy()

        editorView.codeMirrorEditor$.subscribe(() => {
            const innerTextCodeMirror =
                document.getElementById('CodeMirror').innerHTML
            expect(sanitizeCodeScript(innerTextCodeMirror).trim()).toEqual(
                contentYouwolView.trim(),
            )
        })

        // EXPECT - 2 the content of the renderer view display the virtual DOM loaded from 'contentYouwolView'
        const renderView = document.getElementById(
            'render-view',
        ) as any as RenderView
        renderView.renderedElement$.subscribe(({ document, htmlElement }) => {
            expect(document.documentId).toBe('test-story-youwol-view')
            const storyViews = Array.from(
                htmlElement.querySelectorAll('.story-view'),
            )
            expect(storyViews).toHaveLength(2)

            // IFrame encapsulation does not allow to test the rendered IFrame content
            // We would like to test this:
            // There is one correctly formatted code
            //let youwolView = htmlElement.querySelector("#test-youwol-view")
            // And another one with error
            //let errorView = htmlElement.querySelector(".youwol-view-error")
            //expect(errorView).toBeTruthy()

            done()
        })
    })
})
