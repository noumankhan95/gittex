"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SigninPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("http://ticketing.dev/api/users/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // VERY IMPORTANT (cookies)
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.errors?.[0]?.message || "Signin failed");
            }

            // Redirect to landing page
            router.push("/");
            router.refresh(); // ensures server components re-fetch user
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={onSubmit} style={styles.form}>
                <h2>Sign In</h2>

                <input
                    style={styles.input}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    style={styles.input}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button style={styles.button} disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                </button>

                {error && <p style={styles.error}>{error}</p>}
            </form>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: "flex",
        justifyContent: "center",
        marginTop: "100px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        width: "300px",
        gap: "10px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
    },
    input: {
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
    },
    button: {
        padding: "10px",
        backgroundColor: "black",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    error: {
        color: "red",
    },
};