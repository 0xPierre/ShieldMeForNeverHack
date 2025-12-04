export default  function addTagToEmail(email, tag) {
  //Verify that the email is valid with a regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email");
  }

  const [localPart, domain] = email.split("@");
  const taggedLocal = `${localPart}+${tag}`;
  return `${taggedLocal}@${domain}`;
}