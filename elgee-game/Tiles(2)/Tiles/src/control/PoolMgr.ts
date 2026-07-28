export default class PoolMgr {
    private static _instance: PoolMgr = null;
    public static GetInstance() {
        if (!this._instance) {
            this._instance = new PoolMgr();
        }
        return this._instance;
    }

    private pool = [];

    public GetPoolObject(key) {
        let object = null;
        let keys = key.split(".");
        if (!this.pool[key] || this.pool[key].length <= 0) {
            object = fgui.UIPackage.createObject(keys[0], keys[1]);
        } else {
            object = this.pool[key].pop();
        }

        object.scaleX = object.scaleY = 1;
        object.visible = true;
        object.sortOrder = 0;
        object['$isFlyed'] = false;
        return object;
    }

    public Recover(key, object) {
        if (!this.pool[key]) this.pool[key] = [];
        this.pool[key].push(object);
    }
}