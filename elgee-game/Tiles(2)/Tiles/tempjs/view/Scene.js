import ViewManager from "./ViewManager";
export default class Scene {
    constructor() {
        this._showTimes = 0;
        this.openData = null;
    }
    get view() {
        return this._view;
    }
    init(packageName, viewName) {
        this._view = fgui.UIPackage.createObject(packageName, viewName).asCom;
        this._view.makeFullScreen();
    }
    onShown(...args) {
        this.openData = args;
        if (this._showTimes == 0) {
            this.bindChild();
        }
        this._showTimes++;
        this.refresh();
    }
    getButton(btnName, node) {
        var nodes = this.getComponent(btnName, node);
        if (nodes) {
            nodes.onClick(this, this.onClickButton, [nodes.asButton]);
            return nodes.asButton;
        }
    }
    getImage(name, node) {
        var nodes = this.getComponent(name, node);
        return nodes.asImage;
    }
    getList(name, node) {
        var nodes = this.getComponent(name, node);
        return nodes.asList;
    }
    getTextField(name, node) {
        var nodes = this.getComponent(name, node);
        return nodes.asTextField;
    }
    getLabel(name, node) {
        var nodes = this.getComponent(name, node);
        return nodes.asLabel;
    }
    getComponent(name, node) {
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
    bindChild() {
    }
    refresh() {
    }
    onHide() {
        this._view.removeFromParent();
    }
    onClickButton(btn) {
    }
    hide() {
        ViewManager.inst.hideView(this);
        this.onHide();
    }
    ShowAnimation() {
    }
}
//# sourceMappingURL=Scene.js.map