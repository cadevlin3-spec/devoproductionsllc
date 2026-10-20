/* Shared Word doc builder for the CRM and the couple page */
(function(){
function lst(p,k){try{var a=JSON.parse(p[k]||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
function songLine(p,k){return [p[k+'_t'],p[k+'_a']].filter(Boolean).join(' - ')}
function partyLine(p,k){var n=p[k+'_n'],s=[p[k+'_t'],p[k+'_a']].filter(Boolean).join(' - ');return [n,s].filter(Boolean).join(' · ')}
function personLine(p,k){return [p[k+'_n'],p[k+'_p']].filter(Boolean).join(' · ')}
function fmtT(t){var m=/^(\d{1,2}):(\d{2})$/.exec(t||'');if(!m)return t||'';var h=+m[1],ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+m[2]+' '+ap}
function fmt(s,long){if(!s)return '';var q=s.split('-'),d=new Date(+q[0],+q[1]-1,+q[2]);if(isNaN(d))return s;return d.toLocaleDateString('en-US',long?{weekday:'short',month:'short',day:'numeric',year:'numeric'}:{month:'short',day:'numeric'})}
function dayModel(c,p,couple){
 var offs=(p.sec_off||'').split(','),on=function(id){return offs.indexOf(id)<0};
 function songs(k){var a=lst(p,k).map(function(r,i){return (i+1)+'. '+[r.t,r.a].filter(Boolean).join(' - ')});return a.join('   ')}
 function people(k){return lst(p,k).map(function(r){return [r.t,r.a&&'('+r.a+')'].filter(Boolean).join(' ')}).join(', ')}
 var ven=[p.venue1||c.venue,p.venue2].filter(Boolean).join(' → ');
 var head=[['Couple',c.name],['Date',c.event_date&&fmt(c.event_date,true)],['Venue',ven],['Guests',p.guests],['Couple phone',p.couple_phone||(couple?'':c.phone)],['Email',couple?'':c.email],['DJ set-up',p.setup_time&&fmtT(p.setup_time)],['Day-of contact',personLine(p,'dayof')],['Officiant',personLine(p,'officiant')],['Photo / video',personLine(p,'photovideo')]];
 var trads=[['bouquet','Bouquet toss'],['garter','Garter toss'],['dollar','Dollar dance'],['cultural','Cultural'],['games','Games'],['other','Other']].map(function(t){var o=p['t_'+t[0]+'_on'],d=p['t_'+t[0]+'_d'];return o||d?[t[1],[o==='yes'?'Yes':o==='no'?'No':'',d].filter(Boolean).join(' · ')]:['','']});
 var S=[];
 function add(id,t,time,rows){rows=rows.filter(function(r){return r[1]});if(rows.length||time)S.push({t:t,time:time?fmtT(time):'',rows:rows})}
 if(p.setup_time)add('setup','DJ set-up',p.setup_time,[]);
 if(on('ceremony'))add('ceremony','Ceremony',p.cer_time,[['Prelude',p.prelude],['Processional',songLine(p,'pro')],['Bride entrance',songLine(p,'ent')],['Music / readings',p.readings],['Recessional',songLine(p,'rec')],['Mics and audio',p.cer_mics],['Weather plan',p.weather]]);
 if(on('cocktail')){
  add('cocktail','Cocktail hour',p.cocktail_time,[['Length',p.cocktail_len],['Location',p.cocktail_loc],['Music',songs('cocktail_list')],['Announcements',p.cocktail_ann]]);
  add('intros','Grand entrance and introductions',p.intro_time,[['Welcome by',p.welcome_by],['Parents / family',partyLine(p,'intro_parents')],['Ring bearer / flower girl',partyLine(p,'intro_ring')],['Wedding party',people('wp_list')],['Party entrance song',partyLine(p,'intro_party')],['Best man / MOH',partyLine(p,'intro_honor')],['Bride and groom',partyLine(p,'intro_bg')]])}
 if(on('dances'))add('dances','Special dances',null,[['First dance',songLine(p,'dance_bg')],['Parent dance',partyLine(p,'dance_p1')],['Parent dance 2',partyLine(p,'dance_p2')],['Another dance',partyLine(p,'dance_x')]]);
 if(on('dinner'))add('dinner','Dinner and toasts',p.dinner_time,[['Service',p.dinner_style],['Blessing',p.blessing],['Background music',songs('dinner_list')],['Best man toast',p.toast_bm],['Maid of honor toast',p.toast_moh],['More speakers',p.toast_more],['Thank-you',p.thanks],['Dismissal',p.dismissal],['Allergies',p.allergies],['Announcements',p.dinner_ann]]);
 if(on('dances'))add('cake','Cake and dessert',p.cake_time,[['Cake song',songLine(p,'cake')],['Dessert',p.dessert]]);
 if(on('traditions'))add('trads','Traditions',null,trads);
 if(on('dancing'))add('dancing','Open dancing',null,[['Crowd',p.genres],['Clean only?',p.clean],['Group dances',p.group_ok],['Vibe',p.vibe],['Must play',songs('must_list')],['Do NOT play',songs('dont_list')],['Playlist',p.playlist_link],['Last song',songLine(p,'last')]]);
 if(on('sendoff'))add('sendoff','Send-off',p.so_time,[['Style',p.so_style],['Location',p.so_loc],['Song',songLine(p,'so')]]);
 add('notes','Notes',null,[['Notes',p.notes],['Their message',couple?'':c.message]]);
 return {head:head.filter(function(r){return r[1]}),secs:S.filter(function(s){return s.rows.length||s.time})}
}
function loadDocxLib(){return new Promise(function(res,rej){if(window.docx)return res(window.docx);var sc=document.createElement('script');sc.src='/plan/docx.js';sc.onload=function(){window.docx?res(window.docx):rej(new Error('Word library missing'))};sc.onerror=function(){rej(new Error('Could not load the Word library'))};document.head.appendChild(sc)})}
function download(c,p,opts){
 opts=opts||{};var toast=opts.toast||function(){};
 return loadDocxLib().then(function(X){
  var m=dayModel(c,p,opts.couple),W=10512,L=2200,FONT='Calibri';
  function runs(t,o){o=o||{};var parts=String(t).split('\n'),out=[];parts.forEach(function(x,i){out.push(new X.TextRun(Object.assign({text:x,font:FONT,size:o.size||19,break:i?1:0},o.r||{})))});return out}
  var none={style:X.BorderStyle.NONE,size:0,color:'FFFFFF'},line={style:X.BorderStyle.SINGLE,size:4,color:'D9D9D9'};
  function cell(w,children,extra){return new X.TableCell(Object.assign({width:{size:w,type:X.WidthType.DXA},borders:{top:none,left:none,right:none,bottom:line},margins:{top:40,bottom:40,left:60,right:60},children:children},extra||{}))}
  function rowsTable(rows){return new X.Table({width:{size:W,type:X.WidthType.DXA},columnWidths:[L,W-L],borders:{top:none,bottom:none,left:none,right:none,insideHorizontal:none,insideVertical:none},rows:rows.map(function(r){return new X.TableRow({cantSplit:false,children:[cell(L,[new X.Paragraph({children:runs(r[0],{size:17,r:{bold:true,color:'555555'}})})]),cell(W-L,[new X.Paragraph({children:runs(r[1])})])]})})})}
  function band(t,time){return new X.Paragraph({keepNext:true,spacing:{before:200,after:40},shading:{type:X.ShadingType.CLEAR,fill:'111111',color:'auto'},tabStops:[{type:X.TabStopType.RIGHT,position:W-100}],indent:{left:60,right:60},children:[new X.TextRun({text:t.toUpperCase(),bold:true,color:'FFFFFF',font:FONT,size:19}),new X.TextRun({text:time?'\t'+time:'',bold:true,color:'FFFFFF',font:FONT,size:19})]})}
  var kids=[
   new X.Paragraph({spacing:{after:0},children:[new X.TextRun({text:'DEVO PRODUCTIONS',bold:true,font:FONT,size:30}),new X.TextRun({text:'   DJ  •  SOUND  •  WEDDING DAY PLAN',font:FONT,size:16,color:'777777'})]}),
   new X.Paragraph({spacing:{before:60,after:120},children:[new X.TextRun({text:c.name,bold:true,font:FONT,size:44}),new X.TextRun({text:c.event_date?'    '+fmt(c.event_date,true):'',font:FONT,size:22,color:'555555'})]}),
   band('Event overview'),rowsTable(m.head.filter(function(r){return r[0]!=='Couple'&&r[0]!=='Date'}))
  ];
  m.secs.forEach(function(s){kids.push(band(s.t,s.time));if(s.rows.length)kids.push(rowsTable(s.rows))});
  kids.push(new X.Paragraph({spacing:{before:200},alignment:X.AlignmentType.CENTER,children:[new X.TextRun({text:'Thank you for trusting us with your celebration.',italics:true,font:FONT,size:17,color:'777777'})]}));
  var doc=new X.Document({creator:'Devo Productions',title:c.name+' - Wedding Day Plan',styles:{default:{document:{run:{font:FONT,size:19}}}},sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:720,bottom:720,left:864,right:864}}},children:kids}]});
  return X.Packer.toBlob(doc).then(function(b){
   var a=document.createElement('a'),nm=(c.name||'Event').replace(/[\\/:*?"<>|]+/g,'').trim()+' - Wedding Day Plan.docx';
   a.href=URL.createObjectURL(b);a.download=nm;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000);toast('Word doc downloaded')})
 }).catch(function(e){toast(e.message||'Could not build the doc')})
}

window.DevoDoc={download:download};
})();
