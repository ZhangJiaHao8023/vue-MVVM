class Observer{
    constructor(data){
        if(typeof data !== 'object'){
            return;
        }
        this.data=data
        this.init()
    }
    init() {
        //拿到data下所有的变量进行遍历
        Object.keys(this.data).forEach(item => {
            // console.log(item)
            //目标 目标属性  目标值
            this.observer(this.data, item, this.data[item])
        })
        //给所有data属性中每一级都加数据劫持
        new Observer(this.$data)
    }
    observer(target, key, value) {
         new Observer(target[key])
        Object.defineProperty(target, key, {
            get() {
                return value
            },
            set(newValue) {
                value = newValue
                new Observer(value)
            }
        })
    }
}
const utils={
    getValue(data,key){
        if(key.indexOf('.')>-1){
            let keys=key.split('.');
            // console.log(keys,333)
            for(let i=0;i<keys.length;i++){
                data=data[keys[i]]
                // console.log(data,44)
            }
            return data
        }else{
            return data[key]
        }
    }
}
class Mvvm{
    constructor({el,data}){
        //把APP挂载到mvvm实例上
        this.$el=document.getElementById(el)
        this.$data=data
        //给data下的第一层属性添加拦截（数据劫持）
        this.init()
        this.initDom()
    }
    init(){
        //拿到data下所有的变量进行遍历
        Object.keys(this.$data).forEach(item=>{
            // console.log(item)
            //目标 目标属性  目标值
            this.observer(this,item,this.$data[item])
        })
        //给所有data属性中每一级都加数据劫持
        new Observer(this.$data)
    }
    observer(target,key,value){
         Object.defineProperty(target,key,{
             get(){
                 console.log('get方法调用')
                 return value
             },
             set(newValue){
                value=newValue
             }
         })
    }
    initDom(){
        let newFrament =this.createFragme();
        // console.dir(newFrament)
        this.compiler(newFrament)
         this.$el.appendChild(newFrament)
    }
    createFragme(){
        //创建一个文本碎片
        let  fragmenDom = document.createDocumentFragment();
        let firstChild;
        while(firstChild =this.$el.firstChild){
            fragmenDom.appendChild(firstChild)
        }
        return fragmenDom
    }
    compiler(node){
        //判断是元素节点
        if(node.nodeType===1){
            let attributes=Array.from(node.attributes)
            attributes.forEach(item=>{
                if(item.nodeName=='v-model'){
                    console.log(item,888)
                    let res = utils.getValue(this.$data,item.nodeValue)
                    node.value=res
                    console.log(res,'utils')
                }
            })
            
            //判断是否是文本节点
        }else if(node.nodeType===3){

        }
        if(node.childNodes.length>0){
            node.childNodes.forEach(item=>{
                this.compiler(item)
            })
        }
     }
}