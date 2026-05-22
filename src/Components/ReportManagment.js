import { state } from '../Store.js';
import { show } from './ModalManagment.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const SESSION_PRICE = 60000;

function isNative() {
    return typeof Capacitor !== 'undefined' && Capacitor.getPlatform() !== 'web';
}

// --------------------------------------------------------------
// نمایش پیش‌نمایش در iframe (بدون تغییر)
// --------------------------------------------------------------
export function openReportPreview(i) {
    let html = `
    <div style="display:flex; gap:10px; margin-bottom:15px;">
        <button class="btn-success" onclick="buildMonthReportHTML(${i})">📄 PDF کل ماه</button>
        <button class="btn-danger" onclick="closeModal()">❌ بستن</button>
    </div>
    <iframe id="reportFrame" style="width:100%; height:85vh; border:none; border-radius:12px;"></iframe>
    `;
    show(html);
    setTimeout(() => {
        let iframe = document.getElementById("reportFrame");
        iframe.contentDocument.open();
        iframe.contentDocument.write(ExportbuildMonthReportHTML(i));
        iframe.contentDocument.close();
    }, 100);
}

// --------------------------------------------------------------
// تبدیل HTML به PDF با استفاده از div مخفی و html2canvas
// --------------------------------------------------------------
export async function buildMonthReportHTML(monthIndex) {
    const m = state.monthsData[monthIndex];
    if (!m) return;

    // 1. HTML کامل گزارش را از تابع قبلی بگیر
    const fullHtml = ExportbuildMonthReportHTML(monthIndex);
    
    // 2. یک div موقتی خارج از دید ساخته شود
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';       // عرض A4
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '10mm';
    tempDiv.style.direction = 'rtl';
    tempDiv.innerHTML = fullHtml;
    document.body.appendChild(tempDiv);

    // 3. کمی صبر تا رندر کامل شود (مخصوص فونت‌ها)
    await new Promise(r => setTimeout(r, 100));

    try {
        // عکس گرفتن از کل div (به دلیل height خودکار، همه محتوا ثبت می‌شود)
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: tempDiv.scrollWidth,
            windowHeight: tempDiv.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        await saveOrSharePDF(pdf, `month-${m.name}.pdf`);
    } catch (err) {
        console.error('html2canvas error:', err);
        alert('خطا در تولید PDF. لطفاً دوباره تلاش کنید.');
    } finally {
        document.body.removeChild(tempDiv);
    }
}

// --------------------------------------------------------------
// ذخیره در وب / اشتراک در اندروید
// --------------------------------------------------------------
async function saveOrSharePDF(pdf, fileName) {
    if (!isNative()) {
        pdf.save(fileName);
        return;
    }
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    const file = await Filesystem.writeFile({
        path: `${fileName}-${Date.now()}.pdf`,
        data: pdfBase64,
        directory: Directory.Cache
    });
    await Share.share({
        title: "گزارش PDF",
        text: `گزارش مالی ${fileName}`,
        url: file.uri,
        dialogTitle: "اشتراک‌گذاری گزارش"
    });
}

// --------------------------------------------------------------
// گزارش مربی (همین روش)
// --------------------------------------------------------------
export async function printTeacherReport(monthIndex, classIndex) {
    const m = state.monthsData[monthIndex];
    const c = m?.classes?.[classIndex];
    if (!m || !c) return;

    const teacherHtml = buildTeacherReportHTML(monthIndex, classIndex);
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '10mm';
    tempDiv.style.direction = 'rtl';
    tempDiv.innerHTML = teacherHtml;
    document.body.appendChild(tempDiv);
    await new Promise(r => setTimeout(r, 100));

    try {
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        await saveOrSharePDF(pdf, `teacher-${c.teacher}.pdf`);
    } catch (err) {
        console.error(err);
        alert('خطا در تولید PDF مربی');
    } finally {
        document.body.removeChild(tempDiv);
    }
}

// --------------------------------------------------------------
// ساخت HTML مربی (برای div موقتی)
// --------------------------------------------------------------
function buildTeacherReportHTML(monthIndex, classIndex) {
    const m = state.monthsData[monthIndex];
    const c = m?.classes?.[classIndex];
    if (!m || !c) return '<div>خطا</div>';

    let total = 0, discounts = 0;
    let rows = '';
    c.students.forEach((s, idx) => {
        let baseAmount = s.paymentType === 'monthly' ? m.fee : (s.sessionCount || 1) * SESSION_PRICE;
        let discount = s.discount || 0;
        let expected = Math.max(0, baseAmount - discount);
        if (s.paid) {
            total += expected;
            discounts += discount;
        }
        let typeText = s.paymentType === 'monthly' ? 'ماهانه' : `جلسه‌ای (${s.sessionCount || 1})`;
        rows += `
        <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8fafc'};">
            <td style="padding:8px; border:1px solid #ddd;">${s.name}</td>
            <td style="padding:8px; border:1px solid #ddd;">${typeText}</td>
            <td style="padding:8px; border:1px solid #ddd; text-align:center;">${s.paymentType === 'session' ? (s.sessionCount || 1) : '-'}</td>
            <td style="padding:8px; border:1px solid #ddd;">${baseAmount.toLocaleString()}</td>
            <td style="padding:8px; border:1px solid #ddd;">${discount.toLocaleString()}</td>
            <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">${expected.toLocaleString()}</td>
            <td style="padding:8px; border:1px solid #ddd; color:${s.paid ? 'green' : 'red'};">${s.paid ? 'پرداخت شده' : 'پرداخت نشده'}</td>
        </tr>`;
    });

    let coach = total * (c.percent / 100) + (discounts * c.percent / 100);
    let club = total - coach;

    return `
    <!DOCTYPE html>
    <html dir="rtl">
    <head><meta charset="UTF-8"><title>گزارش ${c.teacher}</title>
    <style>
        body { font-family: Tahoma, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
        h1 { text-align:center; background:#4f46e5; color:white; padding:16px; border-radius:14px; }
        table { width:100%; border-collapse:collapse; margin-top:20px; }
        th, td { border:1px solid #ddd; padding:10px; text-align:center; }
        th { background:#eef2ff; }
        .summary { background:#ecfeff; padding:16px; margin-top:20px; border-radius:12px; }
        .footer { margin-top:30px; text-align:center; font-size:12px; color:#64748b; }
    </style>
    </head>
    <body>
        <h1>📋 گزارش مربی: ${c.teacher}</h1>
        <h3>📆 ماه ${m.name}</h3>
        <table><thead><tr><th>نام</th><th>نوع</th><th>جلسات</th><th>پایه</th><th>تخفیف</th><th>نهایی</th><th>وضعیت</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="summary">💰 سهم مربی (${c.percent}%): ${coach.toLocaleString()} تومان<br>🏢 سهم باشگاه: ${club.toLocaleString()} تومان</div>
        <div class="footer">تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</div>
    </body>
    </html>`;
}


function ExportbuildMonthReportHTML(i)
{
    let m = state.monthsData[i];
    if (!m) return '';

    let html = `
    <div style="
        direction: rtl;
        padding: 20px;
        background: white;
        color: #111;
        max-width: 100%;
    ">

    <h1 style="
        text-align: center;
        background: linear-gradient(135deg,#4f46e5,#6366f1);
        color: white;
        padding: 16px;
        border-radius: 14px;
        margin-bottom: 30px;
        font-size:15px;
    ">
    📋 گزارش مالی ماه ${m.name}
    </h1>
    `;

    let grandTotal = 0;
    let grandCoach = 0;
    let grandClub = 0;

    m.classes.forEach((c, classIndex) => {
        let total = 0;
        let discounts = 0;

        html += `
        <div style="
            page-break-after: always;
            margin-bottom: 40px;
        ">

        <h2 style="
    background: linear-gradient(135deg,#0f172a,#1e293b);
    color: white;
    padding: 14px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-size:12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
">
    <span>👨‍🏫 کلاس ${c.teacher} (%${c.percent} سهم مربی)</span>
    <span 
        onclick="window.parent.printTeacherReport(${i}, ${classIndex})" 
        style="
            background: #10b981;
            color: white;
            font-size: 11px;
            padding: 5px 12px;
            border-radius: 8px;
            cursor: pointer;
            user-select: none;
        "
        onmouseover="this.style.background='#059669'"
        onmouseout="this.style.background='#10b981'"
    >
        🖨️ چاپ کردن
    </span>
</h2>

        <div style="
            overflow-x: auto;
            overflow-y: visible;
            border-radius: 14px;
            box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
        ">
        
        <table style="
            width: 100%;
            min-width: 600px;
            font-size: 10px;
            border-collapse: collapse;
            border-radius: 14px;
        ">
        
        <thead>
            <tr style="background:#eef2ff; color:#312e81;">
                <th style="padding:4px; border:1px solid #ddd; white-space: nowrap;">نام شاگرد</th>
                <th style="padding:4px; border:1px solid #ddd; white-space: nowrap;">نوع پرداخت</th>
                <th style="padding:4px; border:1px solid #ddd; white-space: nowrap;">تعداد جلسات</th>
                <th style="padding:4px; border:1px solid #ddd; white-space: nowrap;">مبلغ پایه</th>
                <th style="padding:4px; border:1px solid #ddd; white-space: nowrap;">تخفیف</th>
                <th style="padding:4px; border:1px solid #ddd; white-space: nowrap;">مبلغ نهایی</th>
                <th style="padding:4px; border:1px solid #ddd; white-space: nowrap;">وضعیت</th>
            </tr>
        </thead>
        
        <tbody>
        `;

        c.students.forEach((s, index) => {
            let baseAmount = 0;
            let typeText = '';

            if (s.paymentType === 'monthly') {
                baseAmount = m.fee;
                typeText = 'ماهانه';
            } else {
                let sessionCount = s.sessionCount || 1;
                baseAmount = sessionCount * SESSION_PRICE;
                typeText = `جلسه‌ای (${sessionCount} جلسه)`;
            }
            
            let discount = s.discount || 0;
            let expected = baseAmount - discount;
            if (expected < 0) expected = 0;
        
            if(s.paid)
            {
              total += expected;
              discounts += discount;
            }

            html += `
            <tr style="background:${index % 2 === 0 ? '#fff' : '#f8fafc'};">
                <td style="padding:6px; border:1px solid #e5e7eb; white-space: nowrap;">${s.name}</td>
                <td style="padding:6px; border:1px solid #e5e7eb; white-space: nowrap;">${typeText}</td>
                <td style="padding:6px; border:1px solid #e5e7eb; white-space: nowrap;">
                    ${s.paymentType === 'session' ? (s.sessionCount || 1) : '-'}
                </td>
                <td style="padding:6px; border:1px solid #e5e7eb; white-space: nowrap;">
                    ${baseAmount.toLocaleString()}
                </td>
                <td style="padding:6px; border:1px solid #e5e7eb; color:#dc2626; white-space: nowrap;">
                    ${discount.toLocaleString()}
                </td>
                <td style="padding:6px; border:1px solid #e5e7eb; font-weight:bold; color:#059669; white-space: nowrap;">
                    ${expected.toLocaleString()}
                </td>
                <td style="padding:6px; border:1px solid #e5e7eb; font-weight:bold; color:${s.paid ? '#16a34a' : '#dc2626'}; white-space: nowrap;">
                    ${s.paid ? '✓ پرداخت شده' : '✗ پرداخت نشده'}
                </td>
            </tr>
            `;
        });

        let coach = total * (c.percent / 100);
        let club = total - coach;
        coach += ((discounts * c.percent) / 100);
        club -= ((discounts * c.percent) / 100);

        grandTotal += total;
        grandCoach += coach;
        grandClub += club;

        html += `
        </tbody>
        
        <tfoot>
            <tr style="background:#f1f5f9;">
                <th colspan="5" style="padding:10px; border:1px solid #ddd; white-space: nowrap;">
                    کل دریافتی: ${total.toLocaleString()} تومان
                </th>
                <th colspan="2" style="padding:10px; border:1px solid #ddd; white-space: nowrap;">
                   مبلغ پرداختی بدون محاسبه تخفیف ${(total + discounts).toLocaleString()}
                </th>
            </tr>
            
            <tr>
                <td colspan="7" style="
                    padding: 8px;
                    border: 1px solid #ddd;
                    background: #ecfeff;
                    font-weight: bold;
                    font-size: 10px;
                ">
                    💰 سهم مربی: ${coach.toLocaleString()} تومان
                    <br><br>
                    🏢 سهم باشگاه: ${club.toLocaleString()} تومان
                </td>
            </tr>
        </tfoot>
        
        </table>
        
        </div>
        
        </div>
        `;
    });

    html += `
    <div style="
        page-break-before: always;
        padding-top: 30px;
    ">

    <h2 style="
        background: linear-gradient(135deg,#4f46e5,#6366f1);
        color: white;
        padding: 16px;
        border-radius: 14px;
        text-align: center;
        margin-bottom: 25px;
        font-size:15px;
    ">
    📊 جمع کل باشگاه
    </h2>

    <div style="overflow-x: auto; border-radius: 14px;">
    
    <table style="
        width: 100%;
        min-width: 400px;
        border-collapse: collapse;
        font-size: 12px;
    ">
    
    <thead>
        <tr style="background:#312e81; color:white;">
            <th style="padding:16px; border:1px solid #ddd; white-space: nowrap;">کل دریافتی</th>
            <th style="padding:16px; border:1px solid #ddd; white-space: nowrap;">سهم مربیان</th>
            <th style="padding:16px; border:1px solid #ddd; white-space: nowrap;">سهم باشگاه</th>
        </tr>
    </thead>
    
    <tbody>
        <tr style="background:#f8fafc; font-weight:bold;">
            <td style="padding:18px; border:1px solid #ddd; white-space: nowrap;">
                ${grandTotal.toLocaleString()} تومان
            </td>
            <td style="padding:18px; border:1px solid #ddd; color:#2563eb; white-space: nowrap;">
                ${grandCoach.toLocaleString()} تومان
            </td>
            <td style="padding:18px; border:1px solid #ddd; color:#059669; white-space: nowrap;">
                ${grandClub.toLocaleString()} تومان
            </td>
        </tr>
    </tbody>
    
    </table>
    
    </div>

    </div>

    </div>
    `;

    return html;
}