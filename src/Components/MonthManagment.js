import {show,closeModal} from './ModalManagment.js'
import {saveData,state} from '../Store.js'

const SESSION_PRICE = 60000;

export function openMonth()
{
show(`
<h2 style="margin-bottom:20px;">ایجاد ماه</h2>

نام ماه:
<input id="mname" placeholder="مثلاً فروردین 1405">

<br><br>

شهریه پایه:
<input id="mfee" type="number" placeholder="مبلغ شهریه">

<br><br>

<button class="btn-success" onclick="createMonth()">✅ ایجاد</button>
<button class="btn-danger" onclick="closeModal()">❌ بستن</button>
`);
}

export function createMonth()
{
let monthName = document.getElementById('mname').value.trim();
let monthFee = Number(document.getElementById('mfee').value || 0);

if(!monthName || monthFee<=0){
alert('اطلاعات ناقص است');
return;
}

let copy = JSON.parse(JSON.stringify(state.classes));

copy.forEach(c=>{
c.students.forEach(s=>{
s.paid = false;
});
});

state.monthsData.push({
name:monthName,
fee:monthFee,
classes:copy
});

saveData();
closeModal();
render();

}

export function openMonthView(i)
{
    let m = state.monthsData[i];
    
    // State برای باز/بسته بودن هر معلم
    if (!window.teachersState) window.teachersState = {};
    if (!window.teachersState[i]) window.teachersState[i] = {};

    let html = `
    <style>
        .teacher-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 14px;
            cursor: pointer;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
            user-select: none;
        }
        
        .teacher-header:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102,126,234,0.4);
        }
        
        .teacher-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            padding: 0 12px;
        }
        
        .teacher-content.open {
            max-height: 5000px;
            transition: max-height 0.5s ease-in;
            padding: 12px;
        }
        
    </style>
    
    <h2 style="margin-bottom:20px;">📆 ${m.name}</h2>
    
    <div style="background:#eef2ff; padding:14px; border-radius:14px; margin-bottom:20px;">
        💰 هر جلسه: ${SESSION_PRICE.toLocaleString()} تومان
    </div>
    
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <button class="btn-success" onclick="openReportPreview(${i})">📄 مشاهده گزارش</button>
        <button class="btn-danger" onclick="closeModal()">❌ بستن</button>
    </div>
    `;

    m.classes.forEach((c, ci) => {
        let isOpen = window.teachersState[i][ci] || false;
        
        html += `
        <div class="teacher-wrapper" data-month="${i}" data-class="${ci}">
            <div class="teacher-header" onclick="toggleTeacherContent(${i}, ${ci})">
                <div style="display: flex ; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">👨‍🏫</span>
                    <span>${c.teacher}</span>
                    <span style="font-size: 14px; opacity: 0.8; margin-right: auto;">
                        📊 ${c.students.length} دانش‌آموز
                    </span>
                </div>
            </div>
            
            <div class="teacher-content ${isOpen ? 'open' : ''}" id="content_${i}_${ci}">
        `;

        c.students.forEach((s, si) => {
            let monthlyAmount = m.fee - (s.discount || 0);
            if (monthlyAmount < 0) monthlyAmount = 0;

            let sessionAmount = (s.sessionCount * SESSION_PRICE) - (s.discount || 0);
            if (sessionAmount < 0) sessionAmount = 0;

            let expected = s.paymentType === 'monthly' ? monthlyAmount : sessionAmount;

            html += `
            <div style="
                background:white;
                padding:16px;
                border-radius:18px;
                margin-bottom:16px;
                border:1px solid #e5e7eb;
            ">
                <div style="font-weight:bold; font-size:16px; margin-bottom:12px;">
                    ${s.name}
                </div>
                
                <div style="margin-bottom:10px; color:#64748b;">
                    تخفیف: ${(s.discount || 0).toLocaleString()} تومان
                </div>
                
                <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:14px;">
                    <label style="display:block; margin-bottom:10px;">
                        <input type="radio" name="type_${i}_${ci}_${si}" value="monthly"
                            ${s.paymentType === 'monthly' ? 'checked' : ''}
                            onchange="changePaymentType(${i},${ci},${si},'monthly')">
                        📅 ماهانه (${monthlyAmount.toLocaleString()} تومان)
                    </label>
                    
                    <label>
                        <input type="radio" name="type_${i}_${ci}_${si}" value="session"
                            ${s.paymentType === 'session' ? 'checked' : ''}
                            onchange="changePaymentType(${i},${ci},${si},'session')">
                        🔢 جلسه‌ای
                    </label>
                </div>
                
                <div id="sessionDiv_${i}_${ci}_${si}" style="display: ${s.paymentType === 'session' ? 'block' : 'none'};
                    background:#ecfeff; padding:12px; border-radius:12px; margin-bottom:14px;">
                    تعداد جلسات:
                    <input type="number" min="1" value="${s.sessionCount}"
                        style="margin-top:10px;"
                        onchange="updateSessionCount(${i},${ci},${si},this.value)">
                    <div style="margin-top:10px; font-weight:bold; color:#0f766e;">
                        مبلغ نهایی: ${sessionAmount.toLocaleString()} تومان
                    </div>
                </div>
                
                <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:14px;">
                    💵 مبلغ قابل پرداخت: <strong>${expected.toLocaleString()} تومان</strong>
                </div>
                
                <label style="font-weight:bold;">
                    <input type="checkbox" ${s.paid ? 'checked' : ''}
                        onchange="togglePaid(${i},${ci},${si})">
                    ✅ پرداخت شده
                </label>
            </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    show(html);
}


export function deleteMonth(index)
{
if(confirm('حذف شود؟'))
{  
  state.monthsData.splice(index,1);
   saveData();
   render();
   
}
}

export function toggleTeacherContent(monthIndex, classIndex)
{
    if (!window.teachersState[monthIndex]) {
        window.teachersState[monthIndex] = {};
    }
    
    // تغییر وضعیت
    window.teachersState[monthIndex][classIndex] = !window.teachersState[monthIndex][classIndex];
    
    // پیدا کردن المان محتوا
    let content = document.getElementById(`content_${monthIndex}_${classIndex}`);
    
    if (content) {
        if (window.teachersState[monthIndex][classIndex]) {
            content.classList.add('open');
        } else {
            content.classList.remove('open');
        }
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

export function changePaymentType(
monthIndex,
classIndex,
studentIndex,
type
)
{

let student =
state.monthsData[monthIndex]
.classes[classIndex]
.students[studentIndex];

student.paymentType = type;

saveData();

openMonthView(monthIndex);

}