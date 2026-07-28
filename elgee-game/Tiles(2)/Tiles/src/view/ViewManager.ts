import Scene from "./Scene";
import View from "./View";

export default class ViewManager {
    static _instance: ViewManager = null;
    static get inst(): ViewManager {
        if (!this._instance) {
            this._instance = new ViewManager();
        }
        return this._instance;
    }

    public view = [];

    public vName: Map<string, string> = new Map<string, string>();

    public scene = [];

    public NowScene = null;

    public NowView: View[] = [];

    public mode: fgui.GGraph = null;

    public views: fgui.GComponent = null;

    public toast: fgui.GLabel;

    public all = [];

    public noUserView = null;

    public popView<T extends View>(view: { new(): T }, ...args) {
        var index = -1;
        for (let i = 0; i < this.view.length; i++) {
            if (this.view[i] instanceof view) {
                index = i;
                break;
            }
        }
        var cls: T = null;
        if (index <= -1) {
            cls = new view();
            cls.init('a', 'b');
            this.view.push(cls);
        } else {
            cls = this.view[index];
        }
        cls.onShown(...args);
        this.NowView.push(cls);
        if (!this.mode) {
            this.mode = new fgui.GGraph();
            this.mode.setSize(750, 2000);
            this.mode.drawRect(0, "#ffffff", "#000000");
            this.mode.y = -300;
            this.mode.alpha = 0.6;
        }

        if (!this.views) {
            this.views = new fgui.GComponent();
        }
        this.views.removeChildren();
        this.views.addChild(this.mode);
        this.views.addChild(cls.view);
        this.all.push(cls);
        fgui.GRoot.inst.addChild(this.views);
        cls.view.makeFullScreen();
    }

    public popScene<T extends Scene>(scene: { new(): T }, ...args) {
        if (this.NowScene) {
            this.NowScene.onHide();
            fgui.GRoot.inst.removeChild(this.NowScene.view);
        }

        if (this.NowView.length > 0) {
            for (let i = 0; i < this.NowView.length; i++) {
                fgui.GRoot.inst.removeChild(this.NowView[i].view);
            }
            this.NowView = [];
        }

        this.all = [];
        var cls: T = null;

        var index = -1;
        for (let i = 0; i < this.scene.length; i++) {
            if (this.scene[i] instanceof scene) {
                index = i;
                break;
            }
        }

        if (index <= -1) {
            cls = new scene();
            cls.init('a', 'b');
            this.scene.push(cls);
        } else {
            cls = this.scene[index];
        }

        cls.onShown(...args);
        this.NowScene = cls;
        this.all.push(cls);
        fgui.GRoot.inst.addChild(cls.view);
        cls.view.makeFullScreen();
    }

    public hideView<T extends View>(view: T) {
        for (let i = 0; i < this.NowView.length; i++) {
            if (this.NowView[i].constructor === view.constructor) {
                this.NowView.splice(i, 1);
                break;
            }
        }
        this.views.removeFromParent();
        this.all.pop();
        let len = this.all.length;
    }

    public getScene<T extends Scene>(scene: { new(): T }): T {
        var cls: T = null;
        for (let i = 0; i < this.scene.length; i++) {
            if (this.scene[i] instanceof scene) {
                cls = this.scene[i];
                break;
            }
        }
        return cls;
    }

    public showToast(msg: string) {
        if (!this.toast) {
            this.toast = fgui.UIPackage.createObject('Game', 'toast').asLabel;
        }
        this.toast.title = msg;
        this.toast.x = (fgui.GRoot.inst.width) / 2;
        this.toast.y = (fgui.GRoot.inst.height / 2);
        this.toast.getTransition('t0').play();
        fgui.GRoot.inst.addChild(this.toast);
    }

}