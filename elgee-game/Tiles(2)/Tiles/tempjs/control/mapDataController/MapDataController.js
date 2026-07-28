import LayerWeightVO from "./LayerWeightVO";
import ShapeAreaType from "./ShapeAreaType";
import ShapeGridVO from "./ShapeGridVO";
import ShapeStatusType from "./ShapeStatusType";
export default class MapDataController extends Laya.EventDispatcher {
    constructor() {
        super();
        this.levelDic = {};
        this.layerDic = {};
        this.MAX_QUEUE_TILES = 7;
        this.rect1 = Laya.Rectangle.create();
        this.rect2 = Laya.Rectangle.create();
    }
    static GetInstance() {
        if (MapDataController.instance == null)
            MapDataController.instance = new MapDataController();
        return MapDataController.instance;
    }
    ParseConfig(data) {
        if (!data)
            return;
        let levelConf = data.LevelConf;
        if (levelConf) {
            levelConf.forEach(element => {
                if (!this.levelDic[element.Level])
                    this.levelDic[element.Level] = [element];
                else
                    this.levelDic[element.Level].push(element);
            });
        }
        let layoutConf = data.LayoutConf;
        if (layoutConf) {
            layoutConf.forEach(element => {
                this.layerDic[element.ID] = element;
            });
        }
    }
    HasNextLevel(level) {
        let keys = Object.keys(this.levelDic);
        let minLevel = 99999;
        for (let i = 0; i < keys.length; i++) {
            if (level < keys[i]) {
                minLevel = minLevel > +keys[i] ? +keys[i] : minLevel;
            }
        }
        return minLevel;
    }
    StartLevel(level) {
        this.curLevelMap = [];
        if (!level) {
            console.log("非法关卡");
            return this.curLevelMap;
        }
        let levelInfo = this.randomLevel(level);
        if (!levelInfo) {
            console.log("未在配置中找到此关卡: " + level);
            return this.curLevelMap;
        }
        if (!levelInfo.Layers || levelInfo.Layers.length <= 0) {
            console.log("此关卡没有配置层级: " + levelInfo.ID);
            return this.curLevelMap;
        }
        let gridCount = 0;
        let confirmCount = 0;
        let randomedCount = 0;
        let randomedDic = {};
        let randomedTypes = [];
        let layerInfo;
        let layerGrids;
        let layerIndex = 0;
        let shapeGridVo;
        levelInfo.Layers.forEach(element => {
            layerInfo = this.getLayerByID(element);
            if (layerInfo && layerInfo.Layout && layerInfo.Layout.length > 0 && layerInfo.Weight && layerInfo.Weight.length > 0) {
                layerGrids = [];
                layerInfo.Layout.forEach(elementLayer => {
                    shapeGridVo = ShapeGridVO.GetInstance(layerIndex, layerGrids.length, elementLayer, new LayerWeightVO(layerInfo.Weight));
                    if (shapeGridVo) {
                        layerGrids.push(shapeGridVo);
                        gridCount++;
                        if (shapeGridVo.Type > 0) {
                            confirmCount++;
                            if (randomedDic[shapeGridVo.Type]) {
                                randomedDic[shapeGridVo.Type] = randomedDic[shapeGridVo.Type] - 1;
                                randomedCount = randomedCount - 1;
                                if (randomedDic[shapeGridVo.Type] <= 0) {
                                    delete randomedDic[shapeGridVo.Type];
                                    let index = randomedTypes.indexOf(shapeGridVo.Type);
                                    if (index >= 0)
                                        randomedTypes.splice(index, 1);
                                }
                            }
                            else {
                                randomedDic[shapeGridVo.Type] = 2;
                                randomedCount = randomedCount + 2;
                                randomedTypes.push(shapeGridVo.Type);
                            }
                        }
                    }
                });
                this.curLevelMap.push(layerGrids);
                layerIndex++;
            }
        });
        if (this.curLevelMap.length <= 0) {
            console.log("此关卡没有合法层级: " + levelInfo.ID);
            return this.curLevelMap;
        }
        if (gridCount % 3 != 0) {
            console.log("此关卡格子数不是3的倍数: " + levelInfo.ID);
        }
        let gridWidth = 84 - 4;
        let gridHeight = 100 - 11;
        let layerLen = this.curLevelMap.length;
        let layerInfos;
        for (let i = layerLen - 1; i >= 0; i--) {
            layerInfos = this.curLevelMap[i];
            for (let j = 0; j < layerInfos.length; j++) {
                shapeGridVo = layerInfos[j];
                this.lookAfterGrid(gridWidth, gridHeight, shapeGridVo);
                if (shapeGridVo.Type <= 0) {
                    let leftRandomCount = gridCount - confirmCount - randomedCount;
                    let shapeType = shapeGridVo.RandomType();
                    if (leftRandomCount < 3) {
                        if (randomedTypes.length > 0) {
                            if (!randomedDic[shapeType]) {
                                shapeType = shapeGridVo.RandomType();
                                if (!randomedDic[shapeType])
                                    shapeType = shapeGridVo.RandomType();
                            }
                            if (!randomedDic[shapeType]) {
                                let random = Math.floor(Math.random() * randomedTypes.length);
                                shapeType = randomedTypes[random];
                            }
                            randomedDic[shapeType] = randomedDic[shapeType] - 1;
                            randomedCount = randomedCount - 1;
                            if (randomedDic[shapeType] <= 0) {
                                delete randomedDic[shapeType];
                                let index = randomedTypes.indexOf(shapeType);
                                if (index >= 0)
                                    randomedTypes.splice(index, 1);
                            }
                        }
                        else {
                        }
                    }
                    else {
                        if (randomedDic[shapeType])
                            randomedDic[shapeType] = randomedDic[shapeType] + 2;
                        else {
                            randomedDic[shapeType] = 2;
                            randomedTypes.push(shapeType);
                        }
                        randomedCount = randomedCount + 2;
                    }
                    confirmCount++;
                    shapeGridVo.Type = shapeType;
                }
            }
        }
        for (let i = 0; i < layerLen; i++) {
            layerInfos = this.curLevelMap[i];
            for (let j = 0; j < layerInfos.length; j++) {
                shapeGridVo = layerInfos[j];
                if (!shapeGridVo.IsExistBeforeGrid)
                    shapeGridVo.Status = ShapeStatusType.ENABLE;
            }
        }
        let testDic = {};
        for (let i = 0; i < layerLen; i++) {
            layerInfos = this.curLevelMap[i];
            for (let j = 0; j < layerInfos.length; j++) {
                shapeGridVo = layerInfos[j];
                if (testDic[shapeGridVo.Type]) {
                    testDic[shapeGridVo.Type] = testDic[shapeGridVo.Type] + 1;
                }
                else {
                    testDic[shapeGridVo.Type] = 1;
                }
            }
        }
        for (let type in testDic) {
            if (testDic[type] % 3 != 0) {
                alert("存在不是3倍数的形状：" + type + "_" + testDic[type]);
                break;
            }
        }
        return this.curLevelMap;
    }
    MoveToCollection(shapeGridVo) {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.COLLECTION)
            return null;
        shapeGridVo.Area = ShapeAreaType.COLLECTION;
        let changeStatus = [];
        let afterGrids = shapeGridVo.AfterGrids;
        if (!afterGrids || afterGrids.length <= 0)
            return;
        let afterShapeGridVO;
        for (let i = 0; i < afterGrids.length; i++) {
            afterShapeGridVO = afterGrids[i];
            if (afterShapeGridVO.Status == ShapeStatusType.DISABLE) {
                let isEnable = true;
                let beforeGrids = afterShapeGridVO.BeforeGrids;
                if (beforeGrids && beforeGrids.length > 0) {
                    for (let j = 0; j < beforeGrids.length; j++) {
                        if (beforeGrids[j].Area == ShapeAreaType.OPERATION) {
                            isEnable = false;
                            break;
                        }
                    }
                }
                if (isEnable) {
                    afterShapeGridVO.Status = ShapeStatusType.ENABLE;
                    changeStatus.push(afterShapeGridVO);
                }
            }
        }
        return changeStatus;
    }
    MoveToOperation(shapeGridVo) {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.OPERATION)
            return null;
        shapeGridVo.Area = ShapeAreaType.OPERATION;
        let changeStatus = [];
        let afterGrids = shapeGridVo.AfterGrids;
        if (!afterGrids || afterGrids.length <= 0)
            return;
        let afterShapeGridVO;
        for (let i = 0; i < afterGrids.length; i++) {
            afterShapeGridVO = afterGrids[i];
            if (afterShapeGridVO.Status != ShapeStatusType.DISABLE) {
                afterShapeGridVO.Status = ShapeStatusType.DISABLE;
                changeStatus.push(afterShapeGridVO);
            }
        }
        return changeStatus;
    }
    MoveToLogic(shapeGridVo) {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.LOGIC)
            return null;
        shapeGridVo.Area = ShapeAreaType.LOGIC;
        shapeGridVo.Status = ShapeStatusType.ENABLE;
    }
    MoveToInvalid(shapeGridVo) {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.INVALID)
            return null;
        ShapeGridVO.Recover(shapeGridVo);
    }
    randomLevel(level) {
        let levelList = this.levelDic[level];
        if (!levelList || levelList.length <= 0)
            return null;
        let randIndex = Math.floor(Math.random() * levelList.length);
        return levelList[randIndex];
    }
    getLayerByID(id) {
        return this.layerDic[id];
    }
    lookAfterGrid(gridWidth, gridHeight, shapeGridVo) {
        if (shapeGridVo.LayerIndex <= 0)
            return;
        this.rect1.setTo(shapeGridVo.X, shapeGridVo.Y, gridWidth, gridHeight);
        let layerInfos;
        let afterShapeGridVO;
        for (let i = shapeGridVo.LayerIndex - 1; i >= 0; i--) {
            layerInfos = this.curLevelMap[i];
            for (let j = 0; j < layerInfos.length; j++) {
                afterShapeGridVO = layerInfos[j];
                this.rect2.setTo(afterShapeGridVO.X, afterShapeGridVO.Y, gridWidth, gridHeight);
                if (this.rect1.intersects(this.rect2)) {
                    shapeGridVo.AddAfterGrid(afterShapeGridVO);
                    afterShapeGridVO.AddBeforeGrid(shapeGridVo);
                }
            }
        }
    }
}
//# sourceMappingURL=MapDataController.js.map