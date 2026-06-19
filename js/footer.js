async function loadFooter() {
  try {
    const response = await fetch("components/footer.html");
    const html = await response.text();

    document.getElementById("footer-container").innerHTML = html;
  } catch (error) {
    console.error("Footer load failed");
  }
}

loadFooter();