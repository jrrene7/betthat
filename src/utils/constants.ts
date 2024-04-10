import Google from "src/icons/Google";
import Home from "src/icons/Home";

export const meta = {
  title: "Bet That | Bet on anything",
  description: "Place your bets now. Create a free account today.",
};

export const signInMethods = [
  {
    icons: Google,
    content: "Continue with Google",
    provider: "google",
  },
];

export const menus = [
  {
    name: "For You",
    href: "/",
    icons: Home,
  },
];
