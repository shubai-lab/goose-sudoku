
export default class ResMgr {
    private static _instance: ResMgr = null;
    public static GetInstance() {
        if (!this._instance) {
            this._instance = new ResMgr();
        }
        return this._instance;
    }

    public OffSet = { X: 42, Y: 50 };

    public GetIconUrl(iconIndex: string) {
        return fgui.UIPackage.getItemURL("Tiles", iconIndex);
    }

    public toast: fgui.GLabel;
    public loading: fgui.GComponent;

    public ShowToast(str: string) {
        if (!this.toast) {
            this.toast = fgui.UIPackage.createObject('Tiles', "Toast").asLabel;
        }
        this.toast.title = str;
        fgui.GRoot.inst.addChild(this.toast);
        this.toast.x = fgui.GRoot.inst.width / 2;
        this.toast.y = fgui.GRoot.inst.height / 2;

    }

    public ShowLoading() {
        if (!this.loading) {
            this.loading = fgui.UIPackage.createObject("Common", "Loading").asCom;
        }
        this.loading.removeFromParent();
        fgui.GRoot.inst.addChild(this.loading);
    }

    public hideLoading() {
        if (this.loading) this.loading.removeFromParent();
    }
}