import { VirtualDOM } from "@youwol/flux-view";

export function topBannerView(): VirtualDOM {
    
    return {
        class: 'border fv-color-primary fv-bg-background-alt',
        style:{
            height: '50px'
        }
    }
}