function protectPage(allowedRoles) {

    const session = getSession();

    if (!session) {
        window.location.href = "/login";
        return;
    }

    if (allowedRoles && !allowedRoles.includes(session.rol)) {
        window.location.href = "/login";
        return;
    }
}

(async function () {

    await new Promise((resolve) => {

        const handler = () => {
            window.removeEventListener("auth-ready", handler);
            resolve();
        };

        window.addEventListener("auth-ready", handler);

        setTimeout(() => {
            window.removeEventListener("auth-ready", handler);
            resolve();
        }, 5000);

    });

    protectPage(["guest", "user", "admin"]);

})();