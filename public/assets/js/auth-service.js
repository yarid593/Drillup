class AuthService {

    async loginWithGoogle(firebaseUser) {

        const idToken = await firebaseUser.getIdToken(true);

        const data = await API.post("/auth/firebase", {
            idToken
        });

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        return data.user;
    }

    logout() {

        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");

    }

    getUser() {

        const user = localStorage.getItem("user");

        if (!user) return null;

        return JSON.parse(user);

    }

    async profile() {

        return await API.get("/profile");

    }

}

const Auth = new AuthService();