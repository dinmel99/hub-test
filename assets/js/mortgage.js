
(function(){
'use strict';
const $ = id => document.getElementById(id);
if (!$('mcChildren')) return;
const ids=['mcChildren','mcRate','mcYears','mcLand','mcBuild','mcOwn','mcMinDown'];
const n=id=>Math.max(0,Number($(id).value)||0);
const rub=v=>Math.round(v).toLocaleString('ru-RU')+' ₽';
const row=(label,value)=>'<div class="mc-metric"><span>'+label+'</span><strong>'+value+'</strong></div>';
const cap={1:12000000,2:15000000,3:18000000};
const KEY='edem_mortgage_basic_v2';
const MIN_PCT=0.201;
let summary='';
function calc(){
 const limit=cap[$('mcChildren').value]||12000000;
 const total=n('mcLand')+n('mcBuild');
 const pct=MIN_PCT;
 const down=n('mcOwn');
 const actualPct=total>0?down/total*100:0;
 const minDown=Math.ceil(total*pct);
 const loan=Math.max(0,total-down);
 const over=Math.max(0,loan-limit);
 const short=Math.max(0,minDown-down);
 const required=Math.max(minDown,total-limit);
 const years=Math.max(1,Math.min(30,n('mcYears')||30));
 const months=years*12, rate=n('mcRate')/1200;
 const pay=rate===0?loan/months:loan*rate/(1-Math.pow(1+rate,-months));
 const maxPrice=Math.floor(limit/(1-pct));
 const fullDp=maxPrice-limit;
 $('mcMonthly').textContent=rub(pay);
 $('mcMetrics').innerHTML=[
 row('Стоимость участка',rub(n('mcLand'))),
 row('Стоимость строительства',rub(n('mcBuild'))),
 row('Общая стоимость объекта',rub(total)),
 row('Минимальный ПВ ('+(pct*100).toLocaleString('ru-RU',{maximumFractionDigits:2})+'%)',rub(minDown)),
 row('Указанный ПВ ('+actualPct.toLocaleString('ru-RU',{maximumFractionDigits:4})+'%)',rub(down)),
 row('Лимит кредита',rub(limit)),
 row('Сумма ипотеки',rub(loan)),
 row('Первоначальный взнос для соблюдения лимита',rub(required)),
 row('Переплата по процентам',rub(pay*months-loan)),
 row('Всего выплат по ипотеке',rub(pay*months))
 ].join('');
 const warnings=[];
 if(down>total)warnings.push('Первоначальный взнос превышает стоимость объекта.');
 if(short>0)warnings.push('Не хватает минимального первоначального взноса: '+rub(short)+'.');
 if(over>0)warnings.push('Превышен лимит семейной ипотеки на '+rub(over)+'. Увеличьте ПВ минимум до '+rub(required)+'.');
 if(!warnings.length)warnings.push('Сумма кредита укладывается в лимит, первоначального взноса достаточно.');
 $('mcWarnings').innerHTML=warnings.map((w,i)=>'<p class="mc-small" style="padding:10px 12px;border-radius:10px;background:'+(short||over||down>total?'#fff0e8':'#edf8f0')+';color:'+(short||over||down>total?'#a94321':'#21633b')+'">'+w+'</p>').join('');
 $('mcReference').innerHTML=row('Максимальный кредит',rub(limit))+row('Минимальный ПВ для полного лимита',rub(Math.ceil(limit*pct/(1-pct))))+row('Стоимость объекта для полного лимита',rub(limit+Math.ceil(limit*pct/(1-pct))));
 summary=['Семейная ипотека · Москва и МО','Дети: '+$('mcChildren').selectedOptions[0].text,'Участок: '+rub(n('mcLand')),'Строительство: '+rub(n('mcBuild')),'Общая стоимость: '+rub(total),'Первоначальный взнос: '+rub(down),'Минимальный ПВ: '+rub(minDown),'Сумма ипотеки: '+rub(loan),'Лимит: '+rub(limit),'Ставка: '+n('mcRate')+'%','Срок: '+years+' лет','Ежемесячный платёж: '+rub(pay),...warnings].join('\n');
}
function saved(){
 let list=[];try{list=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
 $('mcSaved').innerHTML=list.length?list.map((x,i)=>'<div class="mc-saved"><span>'+x.name+'</span><button class="mc-btn" data-load="'+i+'">Открыть</button><button class="mc-btn" data-delete="'+i+'">Удалить</button></div>').join(''):'<p class="mc-small">Пока нет сохранённых расчётов.</p>';
}
function syncPercent(){
 const total=n('mcLand')+n('mcBuild');
 const pct=total>0?n('mcOwn')/total*100:0;
 $('mcMinDown').value=Number(pct.toFixed(6)).toString();
}
function syncAmount(){
 const total=n('mcLand')+n('mcBuild');
 const pct=Math.max(0,Math.min(100,n('mcMinDown')));
 $('mcOwn').value=String(Math.round(total*pct/100));
}
ids.forEach(id=>$(id).addEventListener('input',()=>{
 if(id==='mcOwn')syncPercent();
 else if(id==='mcMinDown')syncAmount();
 else if(id==='mcLand'||id==='mcBuild')syncAmount();
 calc();
}));
$('mcSave').onclick=()=>{
 let list=[];try{list=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
 const data={};ids.forEach(id=>data[id]=$(id).value);
 list.unshift({name:new Date().toLocaleString('ru-RU'),data});
 localStorage.setItem(KEY,JSON.stringify(list.slice(0,20)));saved();
};
$('mcSaved').onclick=e=>{
 const b=e.target.closest('button');if(!b)return;
 let list=[];try{list=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
 if(b.dataset.load!==undefined){const item=list[+b.dataset.load];if(item){ids.forEach(id=>{if(item.data[id]!==undefined)$(id).value=item.data[id]});syncPercent();calc()}}
 if(b.dataset.delete!==undefined){list.splice(+b.dataset.delete,1);localStorage.setItem(KEY,JSON.stringify(list));saved()}
};
$('mcCopy').onclick=()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(summary).then(()=>alert('Расчёт скопирован')).catch(()=>prompt('Скопируйте расчёт:',summary));else prompt('Скопируйте расчёт:',summary)};
$('mcPdf').onclick=()=>window.print();
syncPercent();saved();calc();
})();
