import React from "react";
import Header from "./components/Header";
import ReactionGame from "./components/ReactionGame";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-7xl">
        <Header />
        <ReactionGame />
      </div>
    </div>
  );
}