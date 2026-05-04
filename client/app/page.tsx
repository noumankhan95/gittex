import { cookies } from "next/headers";

async function getCurrentUser() {
  try {
    const res = await fetch("http://ticketing.dev/api/users/current-user", {
      method: "GET",
      headers: {
        Cookie: cookies().toString(),
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.currentUser;
  } catch (err) {
    return null;
  }
}

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Landing Page</h1>

      {user ? (
        <div>
          <h2>✅ You are logged in</h2>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
        </div>
      ) : (
        <h2>❌ You are NOT logged in</h2>
      )}
    </div>
  );
}