export class Mvc extends Laya.EventDispatcher {


    send(type, data?) {
        this.event(type, data);
    }
}

export const mvc = new Mvc();