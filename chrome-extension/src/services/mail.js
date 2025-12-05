export function addTagToEmail(email, tag) {
    //Verify that the email is valid with a regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email");
    }
  
    const [localPart, domain] = email.split("@");
    const taggedLocal = `${localPart}+${tag}`;
    return `${taggedLocal}@${domain}`;
  }

export async function autoCompleteEmail(email) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: (email) => {
            const inputs = document.body.querySelectorAll(
                'input[autocomplete~="username"], input[autocomplete~="email"]'
            );

            if (inputs.length === 0) return false;

            inputs.forEach(input => {
                input.value = email;
                input.dispatchEvent(new Event('input', { bubbles: true }));

                // Ajout d'une animation
                input.style.transition = "background-color 0.3s ease";
                input.style.backgroundColor = "#d1f7d6";

                setTimeout(() => {
                    input.style.backgroundColor = "";
                }, 500);
            });

            return true;
        },
        args: [email]
    });

    return result;
}


  