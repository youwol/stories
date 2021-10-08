import { ReplaySubject, Subject } from "rxjs";
import { Node } from "./explorer/nodes";

export class AppState{

    selectedNode$ = new ReplaySubject<Node>(1)
    codeMirrorFetched$ = new Subject()
    constructor(){
    }

}