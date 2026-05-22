import {OpenClass,addStudent,deleteClass,editClass,saveClass,saveEditClass} from './Components/ClassManagment.js'
import {closeModal,show} from './Components/ModalManagment.js'
import {copyBackup,doImport,exportData,importData} from './Components/Exporter.js'
import {createMonth,deleteMonth,openMonth,openMonthView,toggleTeacherContent,changePaymentType} from './Components/MonthManagment.js'
import {render} from './Components/Render.js'
import {openReportPreview,buildMonthReportHTML,printTeacherReport} from './Components/ReportManagment.js'




window.openClass = OpenClass;
window.closeModal = closeModal;
window.show=show;
window.addStudent=addStudent;
window.deleteClass=deleteClass;
window.editClass=editClass;
window.saveClass=saveClass;
window.saveEditClass=saveEditClass;
window.copyBackup=copyBackup;
window.doImport=doImport;
window.exportData=exportData;
window.importData=importData;
window.createMonth=createMonth;
window.deleteMonth=deleteMonth;
window.changePaymentType=changePaymentType;
window.openMonth=openMonth;
window.openMonthView=openMonthView;
window.toggleTeacherContent=toggleTeacherContent;
window.render=render;
window.openReportPreview=openReportPreview;
window.printTeacherReport =printTeacherReport;
window.buildMonthReportHTML=buildMonthReportHTML;
window.onclick = function(e)
{
if(e.target === modal){
closeModal();
}
}
render();