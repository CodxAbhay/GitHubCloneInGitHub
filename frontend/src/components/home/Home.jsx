import Dashboard from "../dashboard/Dashboard";
import Landing from "../landing/Landing";

export default function Home() {
  const userId = localStorage.getItem("userId");
  if (userId) return <Dashboard />;
  return <Landing />;
}
