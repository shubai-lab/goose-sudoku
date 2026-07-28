export default class ResMgr {
    constructor() {
        this.OffSet = { X: 42, Y: 50 };
    }
    static GetInstance() {
        if (!this._instance) {
            this._instance = new ResMgr();
        }
        return this._instance;
    }
    GetIconUrl(iconIndex) {
        return fgui.UIPackage.getItemURL("Tiles", iconIndex);
    }
    ShowToast(str) {
        if (!this.toast) {
            this.toast = fgui.UIPackage.createObject('Tiles', "Toast").asLabel;
        }
        this.toast.title = str;
        fgui.GRoot.inst.addChild(this.toast);
        this.toast.x = fgui.GRoot.inst.width / 2;
        this.toast.y = fgui.GRoot.inst.height / 2;
    }
    ShowLoading() {
        if (!this.loading) {
            this.loading = fgui.UIPackage.createObject("Common", "Loading").asCom;
        }
        this.loading.removeFromParent();
        fgui.GRoot.inst.addChild(this.loading);
    }
    hideLoading() {
        if (this.loading)
            this.loading.removeFromParent();
    }
}
ResMgr._instance = null;
//# sourceMappingURL=ResMgr.js.map