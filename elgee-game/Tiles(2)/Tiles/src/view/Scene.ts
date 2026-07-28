
import ViewManager from "./ViewManager";

export default class Scene {

    private _view: fgui.GComponent;

    private _showTimes: number = 0;

    protected openData = null;

    get view(): fgui.GComponent {
        return this._view;
    }

    constructor() {

    }

    init(packageName, viewName) {
        this._view = fgui.UIPackage.createObject(packageName, viewName).asCom;
        this._view.makeFullScreen();
    }

    public onShown(...args) {
        // this._view.twee
        this.openData = args;
        if (this._showTimes == 0) {
            this.bindChild();
        }
        this._showTimes++;
        this.refresh();
    }

    public getButton(btnName: string, node?: any): fgui.GButton {
        var nodes = this.getComponent(btnName, node);
        if (nodes) {
            nodes.onClick(this, this.onClickButton, [nodes.asButton]);
            return nodes.asButton;
        }
    }

    public getImage(name: string, node?: any): fgui.GImage {
        var nodes = this.getComponent(name, node);
        return nodes.asImage;
    }

    public getList(name: string, node?: any): fgui.GList {
        var nodes = this.getComponent(name, node);
        return nodes.asList;
    }

    public getTextField(name: string, node?: any): fgui.GTextField {
        var nodes = this.getComponent(name, node);
        return nodes.asTextField;
    }

    public getLabel(name: string, node?: any): fgui.GLabel {
        var nodes = this.getComponent(name, node);
        return nodes.asLabel;
    }

    public getComponent(name: string, node?: any): fgui.GComponent {
        if (!node) {
            node = this.view;
        }
        var sp = name.split(".");
        var i = 0;
        while (i < sp.length) {
            node = node.getChild(sp[i]).asCom;
            i++;
        }
        return node;
    }

    public bindChild() {

    }

    public refresh() {

    }

    public onHide() {
        this._view.removeFromParent();
    }

    public onClickButton(btn: fgui.GButton) {
    }

    public hide() {
        ViewManager.inst.hideView(this);
        this.onHide();
    }

    ShowAnimation() {

    }
}