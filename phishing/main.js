class Phishing {
    static _host = "http://127.0.0.1:6123";
    static async isBlacklisted(domain) {
        const response = await fetch(String(this._host + "/api/v1/phishing/check-domain-phishing"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ domain })
        });
        const data = await response.json();
        return data.phishing;
    }
}

Phishing.isBlacklisted("00000000000000000update.emy.ba").then(console.log);
