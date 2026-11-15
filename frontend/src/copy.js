// Copy text to the clipboard. Returns true if it worked.
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/pages where the Clipboard API is blocked
    const box = document.createElement("textarea");
    box.value = text;
    document.body.appendChild(box);
    box.select();
    const done = document.execCommand("copy");
    document.body.removeChild(box);
    return done;
  }
}
