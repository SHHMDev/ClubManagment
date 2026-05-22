export const state = {
    classes: JSON.parse(localStorage.getItem("classes") || "[]"),
    monthsData: JSON.parse(localStorage.getItem("months") || "[]")
};

export function saveData() {

    localStorage.setItem(
        "classes",
        JSON.stringify(state.classes)
    );

    localStorage.setItem(
        "months",
        JSON.stringify(state.monthsData)
    );
}