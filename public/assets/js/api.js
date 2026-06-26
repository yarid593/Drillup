const API = {

    baseUrl: "http://127.0.0.1:8000/api",

    getToken() {
        return localStorage.getItem("auth_token");
    },

    async request(endpoint, options = {}) {

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        const token = this.getToken();

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            this.baseUrl + endpoint,
            {
                ...options,
                headers
            }
        );

        if (!response.ok) {

            const error = await response.json().catch(() => ({}));

            throw error;

        }

        return response.json();
    },

    get(endpoint) {

        return this.request(endpoint);

    },

    post(endpoint, data) {

        return this.request(endpoint, {

            method: "POST",

            body: JSON.stringify(data)

        });

    },

    put(endpoint, data) {

        return this.request(endpoint, {

            method: "PUT",

            body: JSON.stringify(data)

        });

    },

    delete(endpoint) {

        return this.request(endpoint, {

            method: "DELETE"

        });

    }
    

};

async function getEvaluations() {
    return API.get("/evaluations");
}