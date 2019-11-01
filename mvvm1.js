//14
class Dep {
    constructor() {
        this.events = [];//声明一个数组用来存放每次改变值实例的watcher对象
    }
    addWatcher(watcher) {
        this.events.push(watcher);
    }
}
Dep.target = null;//设置Dep下的静态属性target，

const dep = new Dep();
//4
class Observer {
    constructor(data) {
        //判断传进来的数据是不是对象，如果是对象就让他继续执行，如果不是就没必要继续深度监听
        if (typeof data !== 'object') {
            return
        }
        this.data = data;
        this.init()
    }
    //5
    //初始化，拦截第一层数据
    init() {
        Object.keys(this.data).forEach(item => {
            this.observer(this.data, item, this.data[item])
        })
    }
    //6
    observer(obj, key, value) {
        new Observer(obj[key])    //通过递归去实现给深层的数据劫持添加操作
        Object.defineProperty(obj, key, {
            get() {
                //当获取值的时候判断Dep.target是不是空
                if (Dep.target) {
                    //将watcher的整个实例添加进数组进行监听
                    dep.addWatcher(Dep.target);
                }
                return value
            },
            set(newValue) {
                //更改旧值
                value = newValue;
                //如果改为object拦截object中的值
                new Observer(value);
                //遍历数组中添加的所有watcher实例，调用对应的sendValue更改旧值
                dep.events.forEach(item => {
                    item.sendValue(value)
                })
            }
        })
    }
}
const utils = {
    //13
    getValue(data, key) {//接受数据对象还有key
        if (key.indexOf('.') > -1) {   //检测传过来的key中有没有.
            var keys = key.split('.');//有.截取.并获取到.前后的变量名
            for (let i = 0; i < keys.length; i++) {//对截取之后的数组进行遍历
                data = data[keys[i]]//拿到多层嵌套下的属性值
            }
            return data;//return 出去
        } else {
            return data[key];//如果没有.直接return 出去值
        }
    },
    //15
    changeValue(data, key, newValue) {
        if (key.indexOf('.') > -1) {//同理，先检测传过来的变量有没有.的形式
            let keys = key.split('.');
            for (let i = 0; i < keys.length - 1; i++) {
                data = data[keys[i]];  //要拿到最内层的一个对象
            }
            //这时候的data是最内层对象，keys是截取后的一个数组，keys[keys.length-1]获取到最后一个变量名
            data[keys[keys.length - 1]] = newValue;
        } else {
            data[key] = newValue
        }
    }
}

//13
class Watcher {
    constructor(cbk, data, key) {
        this.cbk = cbk;
        this.data = data;
        this.key = key;
        Dep.target = this;//将整个watcher整个实例赋给targt
        this.init();//初始化，拿到要监听的值
    }

    init() {
        this.value = utils.getValue(this.data, this.key)//调用获取值的方法，这时候get方法会执行
        return this.value
    }
    sendValue() {
        this.cbk(this.init())
    }
}
//1
class Mvvm {
    constructor({ el, data }) {
        this.$el = el;  //把app挂载到Mvvm实例上
        this.$data = data;//把要传的数据挂载在mvvm实例上
        //初始化对data中的数据进行劫持
        this.init();
        this.initDom();
    }
    //2
    init() {
        Object.keys(this.$data).forEach(item => {//拿到Mvvm实例上的data下的所有key值 ( 因为我们给他的每一个key进行拦截 )
            //调用拦截方法并把属性的key和value传过去
            this.observer(this, item, this.$data[item])
        })
        new Observer(this.$data)
    }
    //3
    observer(obj, key, value) {//拦截数据的方法
        //给每一个属性的值做一些处理
        Object.defineProperty(obj, key, {
            get() { //添加了get方法

                return value
            },
            set(newValue) {//添加set方法
                value = newValue
            }
        })
    }
    //7
    initDom() {
        this.el = document.getElementById(this.$el);//获取到挂载在实例上的dom节点
        let newFragment = this.createFragment();//穿件文本碎片
        this.compiler(newFragment);//调用文本碎片对app下的子类进行操作
        this.el.appendChild(newFragment)//对子节点操作完毕后从新添加app下
    }
    //8
    createFragment() {//创建文本碎片
        let newFragment = document.createDocumentFragment();//创建文本碎片
        let firstChild;
        while (firstChild = this.el.firstChild) {//判断是否是第一个子元素，
            newFragment.appendChild(firstChild);//就把他添加到文本碎片中，添加之后下一个子元素移动到第一个子元素的位置
        }
        return newFragment;//把含有元素的文本碎return出去

    }
    //9
    compiler(node) {
        //11
        if (node.nodeType === 1) {//如果是子元素
            let attributes = Array.from(node.attributes);//获取到所有的子元素并转成数组
            attributes.forEach(item => {//遍历所有的子元素
                //12
                if (item.nodeName === 'v-model') {//如果子元素的nodeName是v-model
                    //拿到这个属性对应的值
                    let res = utils.getValue(this.$data, item.nodeValue);
                    //给input绑定value，值为data数据中绑定在v-model的变量对应的值
                    node.value = res;
                    //给input添加绑定事件
                    //14
                    node.addEventListener('input', (e) => {
                        //获取到input实时的value的值后我们要做的是把数据中对应的变量改变
                        utils.changeValue(this.$data, item.nodeValue, e.target.value)
                    })
                }
            })
            //11
        } else if (node.nodeType === 3) {//如果是文本节点
            //通过textContent拿到她的文内容，如果查找到{{}}说明是个变量，我们要的是双大括号里的变量名
            let textContent = node.textContent.indexOf('{{') > -1 && node.textContent.split('{{')[1].split('}}')[0];
            // console.log(textContent)
            //如果这个内容存在调用封装好的公共的获取值的方法
            //12
            if (textContent) {
                node.textContent = utils.getValue(this.$data, textContent);//给文本更改默认值
                //监听值的变化
                new Watcher((newVal) => {
                    node.textContent = newVal;
                }, this.$data, textContent)

            }
        }
        //10
        //进入compiler会先对文本碎片中有没有子节点进行判断有的话继续往下执行
        if (node.childNodes.length) {
            //遍历进行递归
            node.childNodes.forEach(item => {
                this.compiler(item);
            })
        }
    }
}