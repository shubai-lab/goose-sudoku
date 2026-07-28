export default class LayerWeightVO {
    constructor(weight) {
        this.totalWeight = 0;
        this.weight = [];
        this.totalWeight = 0;
        let startWeight = 0;
        for (let i = 0; i < weight.length; i++) {
            this.weight.push({ Type: weight[i].Type, StartWeight: startWeight, EndWeight: startWeight + weight[i].Weight });
            startWeight += weight[i].Weight;
        }
        this.totalWeight = startWeight;
    }
    RandomType() {
        let random = Math.floor(Math.random() * this.totalWeight);
        let weightItem;
        for (let i = 0; i < this.weight.length; i++) {
            weightItem = this.weight[i];
            if (random >= weightItem.StartWeight && random <= weightItem.EndWeight)
                return weightItem.Type;
        }
        return 0;
    }
}
//# sourceMappingURL=LayerWeightVO.js.map