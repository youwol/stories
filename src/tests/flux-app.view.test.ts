
import { installMockPackages } from './mock-packages'
installMockPackages()

import { render } from "@youwol/flux-view"
import { take } from "rxjs/operators"
import { FluxAppView, RenderMode } from "../app/main-panels/document-editor/render/youwol-views/flux-app.view"


let projectId = "fake-project-id"

test('flux-app.view with custom style', (done) => {
    
    let vDom = new FluxAppView({
        projectId,
        wrapperDiv:{
            class:'class-test',
            style:{
                width:'50%'
            }
        },
        modes:[RenderMode.Runner, RenderMode.Builder]
    })
    document.body.appendChild(render(vDom))
    // WHEN an instance of FluxAppView is inserted
    let view = document.querySelector(".flux-app-view") as any as FluxAppView
    // EXPECT - 1 : the view is in the document
    expect(view).toBeTruthy()

    // EXPECT - 2 : associated buttons are included
    let buttonRunnerView =  document.querySelector(".tool-bar-mode-view.runner") 
    expect(buttonRunnerView).toBeTruthy()
    let buttonBuilderView =  document.querySelector(".tool-bar-mode-view.builder") 
    expect(buttonBuilderView).toBeTruthy()
    let buttonWorkflowView =  document.querySelector(".tool-bar-mode-view.workflow") 
    expect(buttonWorkflowView).toBeFalsy()
    let fullScreenView = document.querySelector(".request-full-screen") 
    expect(fullScreenView).toBeTruthy()
    let openUrlView = document.querySelector(".window-open-url") 
    expect(openUrlView).toBeTruthy()

    view.renderedIframe$.subscribe( (iframe: HTMLIFrameElement) => {
        // EXPECT - 3 : iframe is rendered with expected style
        expect(iframe.src.includes(`/ui/flux-runner/?id=${projectId}`)).toBeTruthy()
        expect(iframe.parentElement.classList.contains('class-test')).toBeTruthy()
        expect(iframe.parentElement.style.getPropertyValue('width')).toEqual("50%")
        done()
    })
})


test('flux-app.view, no style provided', (done) => {
    document.body.innerHTML = ""
    let vDom = new FluxAppView({
        projectId,
        modes:[RenderMode.Runner, RenderMode.Builder]
    })
    // WHEN an instance of FluxAppView is inserted (no style provided)
    document.body.appendChild(render(vDom))
    let view = document.querySelector(".flux-app-view") as any as FluxAppView

    view.renderedIframe$.subscribe( (iframe: HTMLIFrameElement) => {
        // EXPECT: iframe is rendered with default style
        expect(iframe.parentElement.classList.toString()).toEqual(FluxAppView.defaultClass)
        done()
    })
})


test('flux-app.view, change render mode', (done) => {
    document.body.innerHTML = ""
    let vDom = new FluxAppView({
        projectId,
        modes:[RenderMode.Runner, RenderMode.Builder, RenderMode.Workflow]
    })
    // WHEN an instance of FluxAppView is inserted (all modes)
    document.body.appendChild(render(vDom))
    let view = document.querySelector(".flux-app-view") as any as FluxAppView

    view.renderedIframe$.pipe(
        take(1)
    ).subscribe( (iframe: HTMLIFrameElement) => {
        // EXPECT the default is the flux-runner mode
        expect(iframe.src.includes(`/ui/flux-runner/?id=${projectId}`)).toBeTruthy()
    })

    // WHEN the builder mode is selected
    let buttonBuilderView =  document.querySelector(".tool-bar-mode-view.builder") 
    expect(buttonBuilderView).toBeTruthy()
    buttonBuilderView.dispatchEvent(new Event('click', {bubbles: true}))

    view.renderedIframe$.pipe(
        take(1)
    ).subscribe( (iframe: HTMLIFrameElement) => {
        // EXPECT iframe's url is pointing to flux-builder
        expect(iframe.src.includes(`/ui/flux-builder/?id=${projectId}`)).toBeTruthy()
    })

    // WHEN the workflow mode is selected
    let buttonWorkflowView =  document.querySelector(".tool-bar-mode-view.workflow") 
    expect(buttonWorkflowView).toBeTruthy()
    buttonWorkflowView.dispatchEvent(new Event('click', {bubbles: true}))

    view.renderedIframe$.pipe(
        take(1)
    ).subscribe( (iframe: HTMLIFrameElement) => {
        // EXPECT iframe's url is pointing to flux-runner
        expect(iframe.src.includes(`/ui/flux-runner/?id=${projectId}`)).toBeTruthy()
        done()
    })
})

test('flux-app.view, request full screen', (done) => {

    document.body.innerHTML = ""
    let vDom = new FluxAppView({
        projectId,
        modes:[RenderMode.Runner, RenderMode.Builder, RenderMode.Workflow]
    })
    document.body.appendChild(render(vDom))

    let view = document.querySelector(".flux-app-view") as any as FluxAppView

    view.renderedIframe$.subscribe( (iframe: any) => {
        // install the mock 
        iframe['requestFullscreen'] = () => {
            // THEN it is triggered
            done()
        }
    })
    // WHEN the full-screen mode is selected 
    let fullScreenView = document.querySelector(".request-full-screen") 
    fullScreenView.dispatchEvent(new Event('click', {bubbles: true}))
})

test('flux-app.view, request open url', (done) => {

    document.body.innerHTML = ""
    let vDom = new FluxAppView({
        projectId,
        modes:[RenderMode.Runner, RenderMode.Builder, RenderMode.Workflow]
    })
    document.body.appendChild(render(vDom))

    let view = document.querySelector(".flux-app-view") as any as FluxAppView

    view.renderedIframe$.pipe(
        take(1)
    ).subscribe( (iframe: any) => {
        // install the mock 
        window['open'] = (url, mode) => {
            // THEN it triggers window.open(url, mode)
            expect(url).toEqual(`/ui/flux-runner/?id=${projectId}`)
            expect(mode).toEqual('_blank')
            done()
            window['focus'] = () => {}
            return window
        }
    })
    // WHEN the open-url mode is selected
    let openUrlView = document.querySelector(".window-open-url") 
    openUrlView.dispatchEvent(new Event('click', {bubbles: true}))
})