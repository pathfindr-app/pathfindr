/* One look-ahead job, graph-version guarded, cooperatively scheduled. */
(() => {
    function create({version,active,select,now=()=>performance.now(),yieldWork=()=>new Promise(r=>setTimeout(r,0))}){
        let pending=null,prepared=null,serial=0;
        function clear(){serial++;pending=null;prepared=null;}
        function warm(){
            const graph=version();
            if(pending?.graph===graph)return pending.task;
            const token=++serial;
            const task=(async()=>{
                const iterator=select();let step,start=now();
                do{
                    if(token!==serial||version()!==graph||!active())return null;
                    step=iterator.next();
                    if(!step.done&&now()-start>=2){await yieldWork();start=now();}
                }while(!step.done);
                if(token!==serial||version()!==graph||!active())return null;
                prepared=step.value;return prepared;
            })().catch(error=>{if(token===serial){pending=null;prepared=null;}throw error;});
            pending={graph,task};return task;
        }
        return {warm,clear,async take(){const task=warm(),value=await task;if(pending?.task===task){pending=null;prepared=null;}return value;},
            state:()=>({ready:!!prepared,preparing:!!pending&&!prepared,graph:pending?.graph??null})};
    }
    window.PathfindrVisualizerPreparation={create};
})();
