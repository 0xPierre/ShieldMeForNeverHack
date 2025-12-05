export function changeIcon(level) {
    let iconPath = "";

    switch (level) {
        case 1:
            iconPath = "icons/GREEN.png";
            break;
        case 2:
            iconPath = "icons/ORANGE.png";
            break;
        case 3:
            iconPath = "icons/RED.png";
            break;
        default:
             iconPath = "icons/BLUE.png";
            return;
    }
    chrome.action.setIcon({ path: iconPath });
}