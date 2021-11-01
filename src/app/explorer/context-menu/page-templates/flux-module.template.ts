import { Factory } from "@youwol/flux-core";


export function templateFluxModule(factory: Factory) {

    let resources = Object
        .entries(factory.resources)
        .map(([name, url]) => {
            return `*    [${name}](${url})`
        })

    return `
# Module ${factory.displayName}

## Abstract

Provide here a short abstract of the purpose of the module.


### Illustrative example

It is usually good to also provide an illustrative example (replace with your project id):

\`\`\`javascript
//@story-view
return ({cdn}) => {

    return cdn
        .install({ 
        modules: ['@youwol/story-views'],
        aliases: { 
            views: "@youwol/story-views",
            fluxView: "@youwol/flux-view"
        }
    })
        .then( ({views, fluxView}) => {  

        let vDOM = new views.FluxAppView({
                projectId:"b6f7ae4b-c106-457c-9de1-2c94aeea5986",
                modes:["runner", "workflow", "builder"]
            })
        return {
            view: fluxView.render(vDOM),
            options: {
                wrapper: {
                    style:{ 
                        width:'100%', 
                        'aspect-ratio': '1',
                    }
                }
            }
        }        
    })	
}
\`\`\`

## Configuration

Below is the configuration's settings of the module, they are persisted with the workflow:

\`\`\`javascript
//@story-view
return ({cdn}) => {

    return cdn
        .install({ 
            modules: ['@youwol/story-views'],
            aliases: { 
                views: '@youwol/story-views',
                fluxView: "@youwol/flux-view"
            }
    	})
        .then( ({views, fluxView}) => {  

        let vDOM = new views.ModuleSettingsView({
            toolboxName:"${factory.packId}",
            brickId:"${factory.id}",
            version: "latest",
            class:"mx-auto border rounded p-2",
            style:{
                maxWidth:'500px'
            }
        })
        return {
            view: fluxView.render(vDOM), 
            options: {
                wrapper: {
                    style:{ 
                        width:'100%', 
                        'aspect-ratio': '1',
                    }
                }
            }
        }        
    })	
}
\`\`\`

## Additional examples

You can provide more examples here

## Additional Resources

${resources}
`
}
