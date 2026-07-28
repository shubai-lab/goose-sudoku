import Scene from "./Scene";
import ViewManager from "./ViewManager";

export default class View extends Scene {

    constructor() {
        super();
    }

    public onShown(...args) {
        // this._view.twee
        super.onShown(...args);
        this.ShowAnimation();
    }

    init(viewName, packageName) {
        super.init(viewName, packageName);
        this.view.setPivot(0.5, 0.5, true);
        this.view.setXY(fgui.GRoot.inst.width / 2, fgui.GRoot.inst.height / 2);
    }


    ShowAnimation() {
        this.view.scaleX = this.view.scaleY = 0;
        Laya.Tween.to(this.view, {
            scaleX: 1, scaleY: 1
        }, 200, null);
    }


}