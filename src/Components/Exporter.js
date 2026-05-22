import {show} from './ModalManagment.js'
import {state,saveData} from '../Store.js'

export function exportData()
{

let data = JSON.stringify(state.classes,state.monthsData,null,2);

show(`
<h2 style="margin-bottom:20px;">بکاپ اطلاعات</h2>

<p style="margin-bottom:15px;">
متن زیر را کپی و ذخیره کن.
</p>

<textarea id="backupText">${data}</textarea>

<br><br>

<button class="btn-success" onclick="copyBackup()">
📋 کپی
</button>

<button class="btn-danger" onclick="closeModal()">
❌ بستن
</button>
`);
}

export function copyBackup()
{
let text = document.getElementById('backupText');
text.select();
document.execCommand('copy');
alert('کپی شد');
}

export function importData()
{
    show(`
<h2 style="margin-bottom:20px;">بازیابی اطلاعات</h2>

<p style="margin-bottom:15px;">
متن بکاپ را اینجا Paste کن.
</p>

<textarea id="importText"></textarea>

<br><br>

<button class="btn-success" onclick="doImport()">
⬆ بازیابی
</button>

<button class="btn-danger" onclick="closeModal()">
❌ بستن
</button>
`);
}

export function doImport()
{
let data = JSON.parse(
document.getElementById('importText').value
);

if(data.classes) state.classes = data.classes;
if(data.monthsData) state.monthsData = data.monthsData;

saveData();
closeModal();
alert('اطلاعات بازیابی شد');
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