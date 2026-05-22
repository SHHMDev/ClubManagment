import {state,saveData} from '../Store.js'

export function render()
{
let container = document.getElementById('months');
container.innerHTML = '';

if(state.monthsData.length===0)
{
container.innerHTML = `
<div class="card">
هیچ ماهی ثبت نشده است.
</div>`;
}

state.monthsData.forEach((m,i)=>{

container.innerHTML += `
<div class="card">

<div class="month-top">
<div>
<div class="month-title">📆 ${escapeHtml(m.name)}</div>
<div class="month-fee">شهریه پایه: ${m.fee.toLocaleString()} تومان</div>
</div>

<div class="action-group">
<button class="btn-primary" onclick="openMonthView(${i})">🔍 مشاهده</button>
<button class="btn-danger" onclick="deleteMonth(${i})">🗑 حذف</button>
</div>

</div>

</div>
`;

});

if(state.classes.length>0)
{

container.innerHTML += `<div class="card">
<h2>🏫 کلاس‌ها</h2>`;

state.classes.forEach(c=>{

container.innerHTML += `
<div class="class-box">
<b>${escapeHtml(c.teacher)}</b>
<div style="margin-top:5px;color:#64748b;">
درصد مربی: %${c.percent}
</div>

<button class="btn-danger" onclick="deleteClass(${state.classes.indexOf(c)})">
  حذف کلاس
</button>
<button class="btn-warning" onclick="editClass(${state.classes.indexOf(c)})">
  ویرایش
</button>

</div>`;

});

container.innerHTML += `</div>`;
}else
{
    container.innerHTML += `<div class="card">
هیچ ماهی ثبت نشده است.
</div>`;
}
}

function escapeHtml(str){
if(!str) return '';
return str.replace(/[&<>]/g, function(m){
if(m==='&') return '&amp;';
if(m==='<') return '&lt;';
if(m==='>') return '&gt;';
return m;
});
}