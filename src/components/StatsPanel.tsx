import React, { useEffect, useState } from "react";

export default function StatsPanel() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestInsights, setHighestInsights] = useState(0);

  useEffect(() => {
    const streak = parseInt(localStorage.getItem("currentStreak") || "0");
    const highest = parseInt(localStorage.getItem("highestInsights") || "0");
    setCurrentStreak(streak);
    setHighestInsights(highest);
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 mb-4 w-full max-w-md mx-auto text-center">
      <h2 className="text-xl font-semibold mb-2">Your Progress</h2>
      <div className="flex justify-around">
        <div>
          <div className="text-lg font-bold">{currentStreak}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>
        <div>
          <div className="text-lg font-bold">{highestInsights}</div>
          <div className="text-sm text-gray-600">Highest Insights</div>
        </div>
      </div>
    </div>
  );
}
