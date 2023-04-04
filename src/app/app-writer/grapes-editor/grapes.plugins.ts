import grapesjs from 'grapesjs'
import { AppState } from '../app-state'

export type PluginsStore = {
    [packName: string]: { blocks: string[]; components: string[] }
}

export function synchronizePlugins(
    appState: AppState,
    nativeEditor: grapesjs.Editor,
    externalPlugins: string[],
    globalPlugin,
) {
    const installedPlugins = appState.grapesEditorState.installedPlugins
    const installedPluginsName = Object.keys(installedPlugins)
    const pluginsToAdd = externalPlugins.filter(
        (candidate) => !installedPluginsName.includes(candidate),
    )
    const pluginsToRemove = installedPluginsName.filter(
        (candidate) => !externalPlugins.includes(candidate),
    )
    console.log('synchronize plugins', {
        requested: externalPlugins,
        pluginsToAdd,
        pluginsToRemove,
    })
    pluginsToAdd.forEach((pluginName) => {
        loadPlugin(appState, nativeEditor, pluginName)
    })
    pluginsToRemove.forEach((pluginName) => {
        uninstallPlugin(installedPlugins, nativeEditor, pluginName)
    })
    window['globalPlugin'] = globalPlugin
    loadPlugin(appState, nativeEditor, 'globalPlugin')
}

export function uninstallPlugin(
    installedPlugins: PluginsStore,
    nativeEditor: grapesjs.Editor,
    pluginName,
) {
    if (!installedPlugins[pluginName]) {
        return
    }
    const { blocks, components } = installedPlugins[pluginName]
    blocks.forEach((block) => {
        nativeEditor.BlockManager.remove(block)
    })
    components.forEach((component) => {
        nativeEditor.DomComponents.removeType(component)
    })
    delete installedPlugins[pluginName]
}

export function loadPlugin(
    appState: AppState,
    nativeEditor: grapesjs.Editor,
    pluginName: string,
) {
    console.log('Load plugin', pluginName)
    const installedPlugins = appState.grapesEditorState.installedPlugins
    uninstallPlugin(installedPlugins, nativeEditor, pluginName)
    const plugin = window[pluginName] as unknown as {
        getComponents
        getBlocks
    }
    const input = {
        appState,
        grapesEditor: nativeEditor,
        idFactory: (name) => `${pluginName}#${name}`,
    }
    const components = []
    plugin.getComponents().forEach((ComponentClass) => {
        const component = new ComponentClass(input)
        nativeEditor.DomComponents.addType(component.componentType, component)
        components.push(component.componentType)
    })
    const blocks = []
    plugin.getBlocks().forEach((BlockClass) => {
        const block = new BlockClass(input)
        nativeEditor.BlockManager.add(block.blockType, {
            ...block,
            category: {
                id: pluginName,
                label: pluginName,
                open: false,
            },
        })
        blocks.push(block.blockType)
    })
    installedPlugins[pluginName] = { components, blocks }
    return { components, blocks }
}
