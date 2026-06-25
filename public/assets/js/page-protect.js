(async function () {
  const session = getSession();
  if (session && session.uid?.startsWith("guest_")) {
    protectPage(["guest", "user", "admin"]);
    return;
  }
  await new Promise((resolve) => {
    const handler = (e) => {
      if (e.detail && e.detail.user) {
        window.removeEventListener("auth-ready", handler);
        resolve();
      }
    };
    window.addEventListener("auth-ready", handler);
    setTimeout(() => { window.removeEventListener("auth-ready", handler); resolve(); }, 10000);
  });
  protectPage(["user", "admin"]);
})();
