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
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (email) => {
        const inputs = document.body.querySelectorAll(
          'input[autocomplete~="username"], input[autocomplete~="email"]'
        );
        inputs.forEach(input => {
          input.value = email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      },
      args: [email]
    });
  }
  