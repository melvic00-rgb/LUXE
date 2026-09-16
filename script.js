const audio=document.getElementById("audio");
const fileInput=document.getElementById("fileInput"),addBtn=document.getElementById("addBtn");
const songsEl=document.getElementById("songs"),search=document.getElementById("search");
const title=document.getElementById("title"),artist=document.getElementById("artist");
const albumArt=document.getElementById("albumArt"),miniArt=document.getElementById("miniArt");
const miniTitle=document.getElementById("miniTitle"),miniArtist=document.getElementById("miniArtist");
const play=document.getElementById("play"),miniPlay=document.getElementById("miniPlay");
const prev=document.getElementById("prev"),next=document.getElementById("next");
const progress=document.getElementById("progress"),progressTrack=document.getElementById("progressTrack");
const current=document.getElementById("current"),total=document.getElementById("total");
const miniProgress=document.getElementById("miniProgress"),miniTrack=document.getElementById("miniTrack");
const miniCurrent=document.getElementById("miniCurrent"),miniTotal=document.getElementById("miniTotal");
const volume=document.getElementById("volume"),volText=document.getElementById("volText");
const favorite=document.getElementById("favorite"),shuffle=document.getElementById("shuffle"),repeat=document.getElementById("repeat");
const visualizer=document.getElementById("visualizer"),count=document.getElementById("count");
const sectionTitle=document.getElementById("sectionTitle"),pageTitle=document.getElementById("pageTitle");
const dropzone=document.getElementById("dropzone");

let library=[],currentIndex=-1,shuffleOn=false,repeatOn=false,page="home";
let favorites=JSON.parse(localStorage.getItem("luxeFavorites")||"[]");
let recent=JSON.parse(localStorage.getItem("luxeRecent")||"[]");

addBtn.onclick=()=>fileInput.click();
fileInput.onchange=e=>addFiles([...e.target.files]);

function addFiles(files){
  files.filter(f=>f.type.startsWith("audio/")).forEach(file=>{
    if(library.some(s=>s.key===file.name+file.size))return;
    library.push({file,url:URL.createObjectURL(file),name:clean(file.name),artist:"Local Music",cover:null,key:file.name+file.size});
  });
  render(); if(currentIndex<0&&library.length)load(0);
  fileInput.value="";
}
function clean(n){return n.replace(/\.[^/.]+$/,"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim()}
function esc(s){let d=document.createElement("div");d.textContent=s;return d.innerHTML}
function load(i){
  if(!library[i])return;
  currentIndex=i;let s=library[i];audio.src=s.url;
  title.textContent=s.name;artist.textContent=s.artist;
  miniTitle.textContent=s.name;miniArtist.textContent=s.artist;
  setCover(s.cover); favorite.textContent=favorites.includes(s.key)?"♥":"♡";favorite.classList.toggle("liked",favorites.includes(s.key));
  render();
  if(!recent.includes(s.key))recent.unshift(s.key);
  recent=recent.slice(0,30);localStorage.setItem("luxeRecent",JSON.stringify(recent));
}
function setCover(src){
  albumArt.innerHTML=src?`<img src="${src}">`:`<span>♫</span>`;
  miniArt.innerHTML=src?`<img src="${src}">`:`♫`;
}
function playSong(){if(audio.src)audio.play()}
function pauseSong(){audio.pause()}
play.onclick=()=>audio.paused?playSong():pauseSong();
miniPlay.onclick=()=>audio.paused?playSong():pauseSong();
audio.onplay=()=>{play.textContent="❚❚";miniPlay.textContent="❚❚";albumArt.classList.add("playing");visualizer.classList.add("active")};
audio.onpause=()=>{play.textContent="▶";miniPlay.textContent="▶";albumArt.classList.remove("playing");visualizer.classList.remove("active")};
audio.ontimeupdate=()=>{
  if(!audio.duration)return;let p=audio.currentTime/audio.duration*100;
  progress.style.width=p+"%";miniProgress.style.width=p+"%";current.textContent=fmt(audio.currentTime);miniCurrent.textContent=fmt(audio.currentTime);
};
audio.onloadedmetadata=()=>{total.textContent=fmt(audio.duration);miniTotal.textContent=fmt(audio.duration)};
function seek(e,track){if(!audio.duration)return;let r=track.getBoundingClientRect();audio.currentTime=((e.clientX-r.left)/r.width)*audio.duration}
progressTrack.onclick=e=>seek(e,progressTrack);miniTrack.onclick=e=>seek(e,miniTrack);
next.onclick=nextSong;prev.onclick=()=>{if(!library.length)return;load((currentIndex-1+library.length)%library.length);playSong()};
audio.onended=()=>repeatOn?(audio.currentTime=0,playSong()):nextSong();
function nextSong(){if(!library.length)return;let i;if(shuffleOn){do{i=Math.floor(Math.random()*library.length)}while(i===currentIndex&&library.length>1)}else i=(currentIndex+1)%library.length;load(i);playSong()}
shuffle.onclick=()=>{shuffleOn=!shuffleOn;shuffle.classList.toggle("active",shuffleOn)};
repeat.onclick=()=>{repeatOn=!repeatOn;repeat.classList.toggle("active",repeatOn)};
volume.oninput=()=>{audio.volume=+volume.value;volText.textContent=Math.round(volume.value*100)+"%"};
audio.volume=.8;
favorite.onclick=()=>{
  if(currentIndex<0)return;let k=library[currentIndex].key;
  favorites=favorites.includes(k)?favorites.filter(x=>x!==k):[...favorites,k];
  localStorage.setItem("luxeFavorites",JSON.stringify(favorites));favorite.textContent=favorites.includes(k)?"♥":"♡";favorite.classList.toggle("liked",favorites.includes(k));render();
};
search.oninput=()=>render();

document.querySelectorAll(".nav").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  page=btn.dataset.page;
  let labels={home:["Good music.<br><em>Good mood.</em>","Your Songs"],favorites:["Your favorites.<br><em>Only the good ones.</em>","Favorites"],recent:["Back to your music.<br><em>Recently played.</em>","Recently Played"],queue:["Up next.<br><em>Your listening queue.</em>","Queue"]};
  pageTitle.innerHTML=labels[page][0];sectionTitle.textContent=labels[page][1];search.value="";render();
});
function visible(){
  let arr=library.slice();
  if(page==="favorites")arr=arr.filter(s=>favorites.includes(s.key));
  if(page==="recent"){let map=new Map(library.map(s=>[s.key,s]));arr=recent.map(k=>map.get(k)).filter(Boolean)}
  if(page==="queue")arr=currentIndex>=0?library.slice(currentIndex+1):[];
  let q=search.value.toLowerCase();if(q)arr=arr.filter(s=>(s.name+" "+s.artist).toLowerCase().includes(q));
  return arr;
}
function render(){
  let arr=visible();count.textContent=`${arr.length} ${arr.length===1?"song":"songs"}`;songsEl.innerHTML="";
  if(!arr.length){songsEl.innerHTML=`<div class="empty"><div class="empty-icon">♫</div><b>${page==="favorites"?"No favorites yet":page==="recent"?"Nothing played yet":"Your library is empty"}</b><span>${page==="home"?"Click Add Music or drop files here to begin.":"Your music will appear here."}</span></div>`;return}
  arr.forEach((s,n)=>{
    let real=library.indexOf(s),el=document.createElement("div");el.className="song"+(real===currentIndex?" active":"");el.style.animationDelay=n*.025+"s";
    el.innerHTML=`<div class="song-art">${s.cover?`<img src="${s.cover}">`:"♫"}</div><div class="song-name"><b>${esc(s.name)}</b><span>${esc(s.artist)}</span></div><div class="song-time">—</div><button class="song-more">⋯</button>`;
    el.onclick=()=>{load(real);playSong()};songsEl.appendChild(el);
  });
}
function fmt(x){if(!x||isNaN(x))return"0:00";let m=Math.floor(x/60),s=Math.floor(x%60).toString().padStart(2,"0");return`${m}:${s}`}
["dragenter","dragover"].forEach(e=>dropzone.addEventListener(e,x=>{x.preventDefault();dropzone.classList.add("drag")}));
["dragleave","drop"].forEach(e=>dropzone.addEventListener(e,x=>{x.preventDefault();dropzone.classList.remove("drag")}));
dropzone.addEventListener("drop",e=>addFiles([...e.dataTransfer.files]));
document.addEventListener("keydown",e=>{
  if(e.target.tagName==="INPUT")return;
  if(e.code==="Space"){e.preventDefault();audio.paused?playSong():pauseSong()}
  if(e.code==="ArrowRight"&&audio.duration)audio.currentTime=Math.min(audio.duration,audio.currentTime+5);
  if(e.code==="ArrowLeft")audio.currentTime=Math.max(0,audio.currentTime-5);
  if(e.code==="ArrowUp"){e.preventDefault();volume.value=Math.min(1,+volume.value+.05);volume.dispatchEvent(new Event("input"))}
  if(e.code==="ArrowDown"){e.preventDefault();volume.value=Math.max(0,+volume.value-.05);volume.dispatchEvent(new Event("input"))}
});
render();
