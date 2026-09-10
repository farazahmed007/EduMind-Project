import { useAuth } from "../../context/AuthContext";

function WelcomeSection() {
  const { user } = useAuth();

  const displayName = user?.name || "User";

  return (
    <section className="mb-6">
      <h1 className="text-3xl font-bold text-[#1F6F5F]">
        Welcome back, {displayName}! 👋
      </h1>

      <p className="mt-2 text-gray-600">
        Let's continue your learning journey.
      </p>
    </section>
  );
}

export default WelcomeSection;