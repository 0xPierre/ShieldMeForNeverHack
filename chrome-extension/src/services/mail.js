export default  function addTagToEmail(email, tag) {

  const [localPart, domain] = email.split("@");

  const taggedLocal = `${localPart}+${tag}`;

  return `${taggedLocal}@${domain}`;
}