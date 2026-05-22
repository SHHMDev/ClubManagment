import {closeModal,show} from './ModalManagment.js'
import {render} from './Render.js'
import {state,saveData} from '../Store.js'
export function OpenClass() {
show(`
<h2 style="margin-bottom:20px;">ثبت کلاس جدید</h2>

استاد:
<input id="teacher" placeholder="نام مربی">

<br><br>

درصد مربی:
<input id="percent" type="number" placeholder="مثلاً 50">

<br><br>

<div id="studentsArea"></div>

<button class="btn-primary" onclick="addStudent()">+ افزودن شاگرد</button>
<button class="btn-success" onclick="saveClass()">✅ ثبت</button>
<button class="btn-danger" onclick="closeModal()">❌ بستن</button>
`);
}

export function addStudent(name='', discount=0)
{
const container = document.getElementById('studentsArea');

const div = document.createElement('div');
div.className = 'student-item';

div.innerHTML = `
<lable>نام شاگرد</lable>
<input type="text" value="${escapeHtml(name)}" class="sname" placeholder="نام شاگرد">
<lable>تخفیف</lable>
<input type="number" value="${discount}" class="sdisc" placeholder="تخفیف">
<button class="btn-danger" onclick="this.parentElement.remove()">حذف</button>
`;

container.appendChild(div);
}

export function saveClass()
{
let teacher = document.getElementById('teacher').value.trim();
let percent = Number(document.getElementById('percent').value || 0);

if(!teacher){
alert('نام مربی را وارد کنید');
return;
}

let students = [];

let names = document.querySelectorAll('.sname');
let discs = document.querySelectorAll('.sdisc');

for(let i=0;i<names.length;i++)
{

if(!names[i].value.trim()) continue;

students.push({
name:names[i].value.trim(),
discount:Number(discs[i].value)||0
});
render();
}

if(students.length===0){
alert('حداقل یک شاگرد وارد کنید');
return;
}

state.classes.push({
teacher,
percent,
students
});

saveData();
closeModal();
render();
}

export function deleteClass(i)
{
      if(confirm("کلاس حذف شود؟")){
    state.classes.splice(i,1);
    saveData();
render();

  }
}

export function editClass(i)
{
    let c = state.classes[i];

  show(`
    <h2>ویرایش کلاس</h2>

    استاد:
    <input id="teacher" value="${c.teacher}">

    <br><br>

    درصد مربی:
    <input id="percent" type="number" value="${c.percent}">

    <br><br>

    <div id="studentsArea"></div>

    <button class="btn-primary" onclick="addStudent()">افزودن شاگرد</button>
    <button class="btn-success" onclick="saveEditClass(${i})">ذخیره</button>
  `);

  c.students.forEach(s=>{
    addStudent(s.name, s.discount);
  });
}

export function saveEditClass(i)
{
  let teacher = document.getElementById('teacher').value.trim();
  let percent = Number(document.getElementById('percent').value || 0);

  let students = [];

  document.querySelectorAll('.student-item').forEach(item=>{
    let name = item.querySelector('.sname').value.trim();
    let discount = Number(item.querySelector('.sdisc').value || 0);

    if(name){
      students.push({
        name,
        discount,
        paid:false,
        paymentType:'monthly',
        sessionCount:1
      });
    }
  });

 state.classes[i] = {
    teacher,
    percent,
    students
  };

  saveData();
  closeModal();
  render();

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