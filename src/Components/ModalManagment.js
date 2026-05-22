export function show(html)
{
modal.style.display = "flex";
modalContent.innerHTML = html;

}

export function closeModal(){
modal.style.display = "none";
modalContent.innerHTML = '';
}