import Link from "next/link";
import { cookies } from "next/headers";

async function getCurrentUser() {
    try {
        const res = await fetch("http://ticketing.dev/api/users/current-user", {
            headers: {
                Cookie: cookies().toString(),
            },
            cache: "no-store",
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.currentUser;
    } catch {
        return null;
    }
}

export default async function Header() {
    const user = await getCurrentUser();

    return (
        <div style={styles.nav}>
            <Link href="/">Home</Link>

            <div style={styles.links}>
                {user ? (
                    <>
                        <span>{user.email}</span>
                        <form action="/api/users/signout" method="POST">
                            <button style={styles.button}>Sign Out</button>
                        </form>
                    </>
                ) : (
                    <>
                        <Link href="/signin">Sign In</Link>
                        <Link href="/signup">Sign Up</Link>
                    </>
                )}
            </div>
        </div>
    );
}

const styles: any = {
    nav: {
        display: "flex",
        justifyContent: "space-between",
        padding: "15px 30px",
        borderBottom: "1px solid #ddd",
    },
    links: {
        display: "flex",
        gap: "15px",
        alignItems: "center",
    },
    button: {
        background: "black",
        color: "white",
        border: "none",
        padding: "6px 10px",
        cursor: "pointer",
    },
};