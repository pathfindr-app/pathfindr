/* Uses the existing authenticated Supabase client. Never embeds a service key. */
(() => {
    const auth=()=>typeof PathfindrAuth!=='undefined'?PathfindrAuth:null;
    function client(){const c=auth()?.client;if(!c)throw Error('Cloud connection is not ready. Your local copy is still available.');return c;}
    function check(error){if(error){if(['PGRST202','PGRST205','42P01'].includes(error.code))throw Error('Cloud sharing needs database migration 016. Local save/export is available.');throw Error(error.message||'Cloud request failed.');}}
    async function save(record){const {error}=await client().rpc('save_route_run',{p_id:record.id,p_payload:PathfindrShareData.validate(record.payload),p_pinned:record.pinned});check(error);}
    async function list(){if(!auth()?.currentUser)return [];const {data,error}=await client().from('route_runs').select('id,created_at,pinned,payload').order('created_at',{ascending:false}).limit(100);check(error);return data.map(r=>({id:r.id,ownerId:auth().currentUser.id,createdAt:Date.parse(r.created_at),pinned:r.pinned,payload:PathfindrShareData.validate(r.payload)}));}
    async function publish(payload,requestId){
        const checked=PathfindrShareData.validate(payload);
        if(!auth()?.currentUser)throw Error('Sign in to publish a hosted link.');
        const {data,error}=await client().rpc('publish_route_share',{p_request_id:requestId,p_payload:checked});check(error);return data;
    }
    async function get(id){if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw Error('Invalid share ID.');const {data,error}=await client().rpc('get_route_share',{p_id:id});check(error);if(!data)throw Error('This share was removed or could not be found.');return PathfindrShareData.validate(data);}
    window.PathfindrShareCloud={save,list,publish,get,userId:()=>auth()?.currentUser?.id||null};
})();
