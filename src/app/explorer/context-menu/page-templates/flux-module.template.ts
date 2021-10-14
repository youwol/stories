import { Factory } from "@youwol/flux-core";


export function templateFluxModule(factory: Factory){
    
let resources = Object
.entries(factory.resources)
.map( ([name, url]) => {
    return `*    [${name}](${url})`
})

return `
# Module ${factory.displayName}

## Abstract

Provide here a short abstract of the purpose of the module.

### A couple of usefull markdown tricks:

I just love **bold text**.

Italicized text is the *cat's meow*.

This text is ***really important***.

***

> Dorothy followed her through many of the beautiful rooms in her castle.

> #### The quarterly results look great!
>
> - Revenue was off the chart.
> - Profits were higher than ever.
>
>  *Everything* is going according to **plan**.

***

1. First item
2. Second item

- First item
- Second item
- Third item
- Fourth item

***

At the command prompt, type \`nano\`.

\`\`\`javascript
console.log("Hello world")
\`\`\`

### Illustrative example

It is usually good to also provide an illustrative example (replace with your project id):

\`\`\`youwol-view
return ({youwol, documentScope}) =>{

   return new youwol.FluxAppView({
        projectId: "b6f7ae4b-c106-457c-9de1-2c94aeea5986",
        wrapperDiv: {
          style:{
              aspectRatio: 2
          },
        },
        modes:['runner', 'workflow', 'builder']
    })
 }
\`\`\`

## Configuration

Below is the configuration's settings of the module, they are persisted 
with the workflow:

\`\`\`youwol-view
return ({youwol, documentScope}) =>{

   return new youwol.ModuleSettingsView({
        toolboxName: "${factory.packId}",
        brickId: "${factory.id}",
        version: "latest",
        class:"mx-auto border rounded p-2 w-50",
        style:{
        	maxWidth:'500px'
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