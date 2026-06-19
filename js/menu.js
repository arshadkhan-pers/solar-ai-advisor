async function loadMenu() {
  try {
    const response = await fetch("components/menu.html");
    const html = await response.text();

    document.getElementById("menu-container").innerHTML = html;
  } catch (error) {
    console.error("Menu load failed");
  }
}

function openMenu() {
  const drawer = document.getElementById("menuDrawer");
  const overlay = document.getElementById("menuOverlay");

  if (!drawer || !overlay) return;

  drawer.classList.remove("translate-x-full");
  overlay.classList.remove("hidden");
}

function closeMenu() {
  const drawer = document.getElementById("menuDrawer");
  const overlay = document.getElementById("menuOverlay");

  if (!drawer || !overlay) return;

  drawer.classList.add("translate-x-full");
  overlay.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", loadMenu);
