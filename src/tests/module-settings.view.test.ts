
import { installMockPackages } from './mock-packages'
installMockPackages()

import { render } from "@youwol/flux-view"
import { ModuleSettingsView } from '../app/main-panels/document-editor/render/youwol-views/module-settings.view'
import { FluxPack, Property, Schema } from '@youwol/flux-core'

let pack = new FluxPack({ name: "TestToolbox", version: "", description: "" })

export namespace TestModule {

    @Schema({
        pack,
    })
    export class PersistentData {
        @Property({
            description: "this is just a test"
        })
        testProperty: number
    }
}

window["TestToolbox"] = {
    pack,
    TestModule
}
test('module-settings.view with custom style', (done) => {

    let vDom = new ModuleSettingsView({
        toolboxName: 'TestToolbox',
        brickId: 'TestModule'
    })
    document.body.appendChild(render(vDom))
    // WHEN an instance of FluxAppView is inserted
    let view = document.querySelector(".flux-module-settings-view") as any as ModuleSettingsView
    // EXPECT - 1 : the view is in the document
    expect(view).toBeTruthy()
    view.renderedElement$.subscribe((autoFormView: HTMLDivElement) => {
        // EXPECT - 2 : the property 'testProperty' is displayed
        let title = autoFormView.querySelector(".auto-form-title.value-name-testProperty")
        expect(title).toBeTruthy()
        expect(title['innerText']).toEqual("testProperty")
        done()
    })
})
