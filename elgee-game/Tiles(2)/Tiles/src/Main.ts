import { FguiMgr, MsgType } from "./control/FguiMananger";
import MapDataController from "./control/mapDataController/MapDataController";
import { mvc } from "./control/mvc";
import UserMgr from "./control/UserMgr";
import GameConfig from "./GameConfig";
import TilesItem from "./Item/TilesItem";
import GameScene from "./Scene/GameScene";
import MainScene from "./Scene/MainScene";
import ViewManager from "./view/ViewManager";
class Main {
	constructor() {
		//根据IDE设置初始化引擎		
		Laya.init(750, 1300, Laya["WebGL"]);
		Laya["Physics"] && Laya["Physics"].enable();
		Laya["DebugPanel"] && Laya["DebugPanel"].enable();
		Laya.stage.scaleMode = "fixedwidth";
		Laya.stage.screenMode = "none";
		Laya.stage.alignV = "top";
		Laya.stage.alignH = "left";
		//兼容微信不支持加载scene后缀场景
		Laya.URL.exportSceneToJson = true;

		//打开调试面板（通过IDE设置调试模式，或者url地址增加debug=true参数，均可打开调试面板）

		Laya.alertGlobalError(true);

		fgui.UIConfig.packageFileExtension = "bin";
		//激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
		Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);

		Laya.stage.addChild(fgui.GRoot.inst.displayObject);
		//激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
		Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);

		// if (!this.) {
		// window['wxLogin'] && window['wxLogin']("http://127.0.0.1:5500/bin/")
		// }

		// FguiMgr.getInstance().load("Tiles");

		FguiMgr.getInstance().loadAll();

		Laya.loader.load(["res/config/GameConfig.json", "res/assets/shader/shader.atlas"], Laya.Handler.create(this, () => {
			let data = Laya.loader.getRes("res/config/GameConfig.json");
			MapDataController.GetInstance().ParseConfig(data);
		}))

		mvc.on(MsgType.FGUI_COMP, this, (name) => {
			if (name == "Tiles") {
				this.setExtends();
				UserMgr.GetInstance().init();
				ViewManager.inst.popScene(MainScene);
			}
		});


		mvc.on(MsgType.JUMP_MAIN, this, () => {
			ViewManager.inst.popScene(MainScene);
		})

		//预加载一些资源

	}

	setExtends() {
		fgui.UIObjectFactory.setPackageItemExtension(fgui.UIPackage.getItemURL("Tiles", "tiles_item"), TilesItem);
	}

	onVersionLoaded(): void {
		//激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
		Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
	}

	onConfigLoaded(): void {
		//加载IDE指定的场景
		//GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
	}
}
//激活启动类
new Main();
