/* One versioned record. Storage failure changes persistence, never the reading flow. */
window.BookMemory = (() => {
  const key='historias-nunca-escritas',version=1;
  const names=['eyeRoll','strawberry','shyFace','hiddenNote','signature','pupilSecret','scar','stillWord','survivalEye','returnedBookmark','fugitiveWord'];
  const validPage=value=>Number.isInteger(value)&&[0,1,2,3,4,5,6,7,8,10].includes(value);
  const defaults=()=>({version,completedOnce:false,visits:0,lastPage:null,readingFinished:false,eyesSequenceSeen:false,secrets:Object.fromEntries(names.map(name=>[name,false]))});
  function normalize(value){
    const result=defaults();if(!value||typeof value!=='object'||value.version!==version)return result;
    for(const name of ['completedOnce','readingFinished','eyesSequenceSeen'])result[name]=value[name]===true;
    result.visits=Number.isSafeInteger(value.visits)&&value.visits>=0?value.visits:0;
    result.lastPage=validPage(value.lastPage)?value.lastPage:null;
    for(const name of names)result.secrets[name]=value.secrets?.[name]===true;
    return result;
  }
  let state=defaults(),futureVersion=false;
  const url=new URL(location.href);
  if(url.searchParams.get('reset')==='1'){
    try{localStorage.removeItem(key);}catch{}
    url.searchParams.delete('reset');
    try{history.replaceState(history.state,'',url.pathname+url.search+url.hash);}catch{}
  }
  try{const stored=JSON.parse(localStorage.getItem(key));futureVersion=stored?.version>version;state=normalize(stored);}catch{}
  const atLoad=JSON.parse(JSON.stringify(state));
  function save(){
    if(futureVersion)return;
    try{
      // Preserve discoveries made by another open tab without extra storage keys.
      const other=normalize(JSON.parse(localStorage.getItem(key)));
      for(const name of names)state.secrets[name] ||= other.secrets[name];
      state.completedOnce ||= other.completedOnce;state.eyesSequenceSeen ||= other.eyesSequenceSeen;
      state.visits=Math.max(state.visits,other.visits);
      localStorage.setItem(key,JSON.stringify(state));
    }catch{try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
  }
  state.visits=Math.min(Number.MAX_SAFE_INTEGER,state.visits+1);save();
  return {
    key,atLoad,get state(){return state;},validPage,
    discover(name){if(names.includes(name)){state.secrets[name]=true;save();}},
    has(name){try{const other=normalize(JSON.parse(localStorage.getItem(key)));state.secrets[name] ||= other.secrets[name];}catch{}return state.secrets[name]===true;},
    page(value){if(validPage(value)){state.lastPage=value;state.readingFinished=false;save();}},
    eyes(){state.eyesSequenceSeen=true;save();},
    complete(){state.completedOnce=true;state.readingFinished=true;save();},
    restart(){state.lastPage=null;state.readingFinished=false;save();}
  };
})();
