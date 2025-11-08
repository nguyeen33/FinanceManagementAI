import { currentUser } from "@clerk/nextjs/server";
import Guest from "@/components/Guest";

export default async function HomePage() {
  const user = await currentUser();

  if (!user) {
    return <Guest/>;
  }

  return (
    <main>
      <h1>Welcome to the Home Page</h1>
      <p>This is the main landing page of the application.</p>
    </main>
  );
} 