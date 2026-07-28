import { FguiMgr, MsgType } from "./control/FguiMananger";
import MapDataController from "./control/mapDataController/MapDataController";
import { mvc } from "./control/mvc";
import UserMgr from "./control/UserMgr";
import TilesItem from "./Item/TilesItem";
import MainScene from "./Scene/MainScene";
import ViewManager from "./view/ViewManager";
class Main {
    constructor() {
        Laya.init(750, 1300, Laya["WebGL"]);
        Laya["Physics"] && Laya["Physics"].enable();
        Laya["DebugPanel"] && Laya["DebugPanel"].enable();
        Laya.stage.scaleMode = "fixedwidth";
        Laya.stage.screenMode = "none";
        Laya.stage.alignV = "top";
        Laya.stage.alignH = "left";
        Laya.URL.exportSceneToJson = true;
        Laya.alertGlobalError(true);
        fgui.UIConfig.packageFileExtension = "bin";
        Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        Laya.stage.addChild(fgui.GRoot.inst.displayObject);
        Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        FguiMgr.getInstance().loadAll();
        Laya.loader.load(["res/config/GameConfig.json", "res/assets/shader/shader.atlas"], Laya.Handler.create(this, () => {
            let data = Laya.loader.getRes("res/config/GameConfig.json");
            MapDataController.GetInstance().ParseConfig(data);
        }));
        mvc.on(MsgType.FGUI_COMP, this, (name) => {
            if (name == "Tiles") {
                this.setExtends();
                UserMgr.GetInstance().init();
                ViewManager.inst.popScene(MainScene);
            }
        });
        mvc.on(MsgType.JUMP_MAIN, this, () => {
            ViewManager.inst.popScene(MainScene);
        });
    }
    setExtends() {
        fgui.UIObjectFactory.setPackageItemExtension(fgui.UIPackage.getItemURL("Tiles", "tiles_item"), TilesItem);
    }
    onVersionLoaded() {
        Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
    }
    onConfigLoaded() {
    }
}
new Main();
//# sourceMappingURL=Main.js.map