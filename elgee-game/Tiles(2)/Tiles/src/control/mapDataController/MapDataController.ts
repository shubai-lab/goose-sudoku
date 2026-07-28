
import LayerWeightVO from "./LayerWeightVO";
import ShapeAreaType from "./ShapeAreaType";
import ShapeGridVO from "./ShapeGridVO";
import ShapeStatusType from "./ShapeStatusType";

export default class MapDataController extends Laya.EventDispatcher {

    private levelDic = {};//按Level存储
    private layerDic = {};//按ID存储
    private curLevelMap: Array<Array<ShapeGridVO>>;//当前关卡地图

    public MAX_QUEUE_TILES = 7;

    constructor() {
        super();
    }

    static instance: MapDataController;
    public static GetInstance(): MapDataController {
        if (MapDataController.instance == null)
            MapDataController.instance = new MapDataController();
        return MapDataController.instance;
    }

    //解析配置
    public ParseConfig(data: any): any {
        if (!data) return;
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

    /**
     * @method 获取是否还有下一关卡
     * @param level 
     * @returns 
     */
    public HasNextLevel(level) {
        let keys = Object.keys(this.levelDic);
        let minLevel = 99999;
        for (let i = 0; i < keys.length; i++) {
            if (level < keys[i]) {
                minLevel = minLevel > +keys[i] ? +keys[i] : minLevel;
            }
        }
        return minLevel;
    }

    /****************************************************
    开始关卡 返回二维数组
    [
    [ShapeGridVO,ShapeGridVO,ShapeGridVO...]//第0层：最下面的层
    [ShapeGridVO,ShapeGridVO,ShapeGridVO...]//第1层
    [ShapeGridVO,ShapeGridVO,ShapeGridVO...]//第2层
    ]
    ****************************************************/
    public StartLevel(level: number): Array<Array<ShapeGridVO>> {
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

        let gridCount: number = 0;//格子的数量
        let confirmCount: number = 0;//确认的数量
        let randomedCount: number = 0;//已随机出的数量
        let randomedDic: Object = {};//已随机出的字典(key:type data:数量)
        let randomedTypes: Array<number> = [];//已随机出的类型数组

        let layerInfo: { ID: number, Layout: Array<{ X: number, Y: number, Type: number }>, Weight: Array<{ Type: number, Weight: number }> };
        let layerGrids: Array<ShapeGridVO>;
        let layerIndex: number = 0;
        let shapeGridVo: ShapeGridVO;

        levelInfo.Layers.forEach(element => {
            layerInfo = this.getLayerByID(element);
            if (layerInfo && layerInfo.Layout && layerInfo.Layout.length > 0 && layerInfo.Weight && layerInfo.Weight.length > 0) {
                layerGrids = [];
                layerInfo.Layout.forEach(elementLayer => {
                    shapeGridVo = ShapeGridVO.GetInstance(layerIndex, layerGrids.length, elementLayer, new LayerWeightVO(layerInfo.Weight));
                    if (shapeGridVo) {
                        layerGrids.push(shapeGridVo);
                        gridCount++;

                        if (shapeGridVo.Type > 0)//已指定类型
                        {
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

        let gridWidth:number = 84 - 4;
        let gridHeight:number = 100 - 11;
        let layerLen: number = this.curLevelMap.length;
        let layerInfos: Array<ShapeGridVO>;

        for (let i: number = layerLen - 1; i >= 0; i--) {
            layerInfos = this.curLevelMap[i];
            for (let j: number = 0; j < layerInfos.length; j++) {
                shapeGridVo = layerInfos[j];

                //检索前后置关系
                this.lookAfterGrid(gridWidth, gridHeight, shapeGridVo);

                //随机格子形状
                if (shapeGridVo.Type <= 0) {
                    let leftRandomCount: number = gridCount - confirmCount - randomedCount;
                    let shapeType: number = shapeGridVo.RandomType();
                    if (leftRandomCount < 3)//不能再随机了:从randomedDic中消耗
                    {
                        if (randomedTypes.length > 0)//从已随机中消耗
                        {
                            if (!randomedDic[shapeType])//已随机中没有此类型
                            {
                                shapeType = shapeGridVo.RandomType();//随第二次
                                if (!randomedDic[shapeType])//已随机中没有此类型
                                    shapeType = shapeGridVo.RandomType();//随第三次
                            }
                            if (!randomedDic[shapeType])//已随机中没有此类型
                            {
                                // for (let type in randomedDic)//从已随机出中取第一个type
                                // {
                                //     shapeType = Number(type);
                                //     break;
                                // }
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
                        else//已随机中没有了：出现这种情况多般是配置个格子数不是3的倍数，那就保持权重随机
                        {

                        }
                    }
                    else//一次随机相当于随三个，因为要保证同形状的是3的倍数
                    {
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

        //初始化格子信息
        for (let i: number = 0; i < layerLen; i++) {
            layerInfos = this.curLevelMap[i];
            for (let j: number = 0; j < layerInfos.length; j++) {
                shapeGridVo = layerInfos[j];

                //无前置格子：可用
                if (!shapeGridVo.IsExistBeforeGrid)
                    shapeGridVo.Status = ShapeStatusType.ENABLE;
            }
        }

        //测试检查
        let testDic = {};
        for (let i: number = 0; i < layerLen; i++) {
            layerInfos = this.curLevelMap[i];
            for (let j: number = 0; j < layerInfos.length; j++) {
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
        //测试检查

        return this.curLevelMap;
    }

    //移动到收集区：我的后置可能会亮起
    public MoveToCollection(shapeGridVo: ShapeGridVO): Array<ShapeGridVO> {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.COLLECTION)
            return null;
        shapeGridVo.Area = ShapeAreaType.COLLECTION;
        let changeStatus: Array<ShapeGridVO> = [];//状态变化列表
        let afterGrids: Array<ShapeGridVO> = shapeGridVo.AfterGrids;
        if (!afterGrids || afterGrids.length <= 0) return;
        let afterShapeGridVO: ShapeGridVO;
        for (let i: number = 0; i < afterGrids.length; i++)//遍历我的后置格子
        {
            afterShapeGridVO = afterGrids[i];
            if (afterShapeGridVO.Status == ShapeStatusType.DISABLE) {
                let isEnable: boolean = true;
                let beforeGrids = afterShapeGridVO.BeforeGrids;
                if (beforeGrids && beforeGrids.length > 0)//遍历前置
                {
                    for (let j: number = 0; j < beforeGrids.length; j++) {
                        if (beforeGrids[j].Area == ShapeAreaType.OPERATION)//前置中有一个还在操作区
                        {
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

    //移动至操作区：我的后置可能会暗置
    public MoveToOperation(shapeGridVo: ShapeGridVO): Array<ShapeGridVO> {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.OPERATION)
            return null;
        shapeGridVo.Area = ShapeAreaType.OPERATION;
        let changeStatus: Array<ShapeGridVO> = [];//状态变化列表
        let afterGrids: Array<ShapeGridVO> = shapeGridVo.AfterGrids;
        if (!afterGrids || afterGrids.length <= 0) return;
        let afterShapeGridVO: ShapeGridVO;
        for (let i: number = 0; i < afterGrids.length; i++)//遍历我的后置格子
        {
            afterShapeGridVO = afterGrids[i];
            if (afterShapeGridVO.Status != ShapeStatusType.DISABLE) {
                afterShapeGridVO.Status = ShapeStatusType.DISABLE;
                changeStatus.push(afterShapeGridVO);
            }
        }
        return changeStatus;
    }

    //移动至逻辑区
    public MoveToLogic(shapeGridVo: ShapeGridVO): void {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.LOGIC)
            return null;
        shapeGridVo.Area = ShapeAreaType.LOGIC;
        shapeGridVo.Status = ShapeStatusType.ENABLE;
    }

    //移动至销毁区
    public MoveToInvalid(shapeGridVo: ShapeGridVO): void {
        if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.INVALID)
            return null;
        ShapeGridVO.Recover(shapeGridVo);
    }





    //随机关卡
    private randomLevel(level: number): { ID: number, Level: number, Layers: Array<number> } {
        let levelList = this.levelDic[level];
        if (!levelList || levelList.length <= 0)
            return null;
        let randIndex: number = Math.floor(Math.random() * levelList.length);
        return levelList[randIndex];
    }

    //按ID获取层级
    private getLayerByID(id: number): { ID: number, Layout: Array<{ X: number, Y: number, Type: number }>, Weight: Array<{ Type: number, Weight: number }> } {
        return this.layerDic[id];
    }

    //查找后置关卡
    private rect1: Laya.Rectangle = Laya.Rectangle.create();
    private rect2: Laya.Rectangle = Laya.Rectangle.create();
    private lookAfterGrid(gridWidth: number, gridHeight: number, shapeGridVo: ShapeGridVO) {
        if (shapeGridVo.LayerIndex <= 0) return;
        this.rect1.setTo(shapeGridVo.X, shapeGridVo.Y, gridWidth, gridHeight);
        let layerInfos: Array<ShapeGridVO>;
        let afterShapeGridVO: ShapeGridVO;
        for (let i: number = shapeGridVo.LayerIndex - 1; i >= 0; i--) {
            layerInfos = this.curLevelMap[i];
            for (let j: number = 0; j < layerInfos.length; j++) {
                afterShapeGridVO = layerInfos[j];
                this.rect2.setTo(afterShapeGridVO.X, afterShapeGridVO.Y, gridWidth, gridHeight);
                if (this.rect1.intersects(this.rect2))//相交
                {
                    shapeGridVo.AddAfterGrid(afterShapeGridVO);
                    afterShapeGridVO.AddBeforeGrid(shapeGridVo);
                }
            }
        }
    }
}