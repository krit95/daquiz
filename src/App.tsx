import { useEffect, useState } from "react";
import "./index.css";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import Confetti from "react-confetti";
import { firebaseConfig } from "./firebaseConfig";
import { IonIcon } from "@ionic/react";
import { arrowForwardOutline } from "ionicons/icons";
import barChartIcon from './assets/bar-chart-676.png';
import StatsPanel from "./components/StatsPanel";


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

interface Question {
  id: string;
  context?: string;
  question: string;
  type: "mcq" | "text" | "multi";
  options?: string[];
  answer: string | string[];
  hint?: string;
  solution: string;
  explainButton?: boolean;
}

function App() {
  const [correctAnswerCount, setCorrectAnswerCount] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showBonus, setShowBonus] = useState(false);


  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    const fetchQuestions = async () => {
      const today = new Date().toLocaleDateString("en-CA"); // Format date for daily questions
      const dbRef = ref(db, `questions/${today}`);

      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const questionData = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          })) as Question[];
          setQuestions(questionData);
        } else {
          console.log("No questions available today.");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, []);

  const handleSubmit = () => {
    if (!currentQuestion) return;

    let correct = false;

    if (currentQuestion.type === "multi") {
      const correctAnswers = (currentQuestion.answer as string[]).map((a) =>
        a.trim().toLowerCase()
      );
      const userAnswers = selectedAnswers.map((a) => a.trim().toLowerCase());

      correct =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((ans) => userAnswers.includes(ans));
    } else if (currentQuestion.type === "mcq") {
      correct =
        selectedAnswer.trim().toLowerCase() ===
        (currentQuestion.answer as string).trim().toLowerCase();
    } else if (currentQuestion.type === "text") {
      // For text-based questions, ignore case and trim both inputs
      correct =
        selectedAnswer.trim().toLowerCase() ===
        (currentQuestion.answer as string).trim().toLowerCase();
    }

    setIsCorrect(correct);
    setIsSubmitted(true);

    if (!correct) {
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);
    } else {
      setCorrectAnswerCount((prev) => prev + 1);
      setShowBonus(true);
      setTimeout(() => setShowBonus(false), 5000); // Hide animation after 1 second
    }

    if (currentQuestionIndex === questions.length - 1) {
      console.log("Updating insights for ", correctAnswerCount);
      updateInsights(correctAnswerCount);
    }
  };


  const handleNext = () => {
    setCurrentQuestionIndex((i) => i + 1);
    setSelectedAnswer("");
    setSelectedAnswers([]);
    setShowHint(false);
    setIsSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
  };

  const toggleMultiSelect = (option: string) => {
    if (selectedAnswers.includes(option)) {
      setSelectedAnswers(selectedAnswers.filter((o) => o !== option));
    } else {
      setSelectedAnswers([...selectedAnswers, option]);
    }
  };

  function updateInsights(correctAnswers: number) {
    const insights = correctAnswers * 10;
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    const history = JSON.parse(localStorage.getItem("insightHistory") || "{}");
    history[today] = insights;
    localStorage.setItem("insightHistory", JSON.stringify(history));

    const highest = parseInt(localStorage.getItem("highestInsights") || "0");
    if (insights > highest) {
      localStorage.setItem("highestInsights", insights.toString());
    }

    const lastQuizDate = localStorage.getItem("lastQuizDate");
    let streak = parseInt(localStorage.getItem("currentStreak") || "0");

    if (lastQuizDate) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (lastQuizDate === yesterday) {
        streak += 1;
      } else if (lastQuizDate !== today) {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    localStorage.setItem("currentStreak", streak.toString());
    localStorage.setItem("lastQuizDate", today);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] to-[#fce4ec] flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl gap-4">
        <div className="animate-fade-in w-full lg:w-2/3 p-6 bg-white rounded-2xl shadow-xl space-y-4">
          <div className="flex w-full item-center justify-center "><img src={barChartIcon} alt="Bar chart logo" className="w-10 h-10" /></div>
          <h1 className="text-3xl font-bold text-indigo-700 text-center">Data Quiz of the Day</h1>

          <div className="p-4">
            <StatsPanel />

            {currentQuestion ? (
              <>
                {currentQuestion.context && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-gray-700">
                    {currentQuestion.context}
                  </div>
                )}

                <p className="text-gray-700 text-lg">{currentQuestion.question}</p>

                {currentQuestion.type === "mcq" || currentQuestion.type === "multi" ? (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, idx) => {
                      const isSelected =
                        currentQuestion.type === "multi"
                          ? selectedAnswers.includes(option)
                          : selectedAnswer === option;

                      const isCorrectAnswer =
                        Array.isArray(currentQuestion.answer)
                          ? currentQuestion.answer.map((a) => a.toLowerCase()).includes(option.toLowerCase())
                          : option.trim().toLowerCase() === currentQuestion.answer.toString().trim().toLowerCase();

                      return (
                        <div
                          key={idx}
                          className={`cursor-pointer w-full flex items-center justify-between px-4 py-2 rounded-lg border
                            ${isSubmitted
                              ? isCorrectAnswer
                                ? "bg-green-100 text-green-700"
                                : isSelected
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-50"
                              : isSelected
                              ? "bg-indigo-100 border-indigo-400"
                              : "bg-gray-50"
                            }`}
                          onClick={() =>
                            !isSubmitted &&
                            (currentQuestion.type === "multi"
                              ? toggleMultiSelect(option)
                              : setSelectedAnswer(option))
                          }
                        >
                          <span>{option}</span>
                          {isSubmitted && (
                            <>
                              {isCorrectAnswer && <span className="text-green-600">✅</span>}
                              {!isCorrectAnswer && isSelected && <span className="text-red-600">❌</span>}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={isSubmitted && isCorrect}
                  />
                )}

                {showHint && currentQuestion.hint && (
                  <div className="bg-yellow-100 p-3 rounded text-sm">{currentQuestion.hint}</div>
                )}

                {currentQuestion.type === "text" && isSubmitted && !isCorrect && (
                  <div className="text-sm text-red-600 mt-2">
                    <p>Your answer is incorrect. The correct answer is:</p>
                    <p className="font-bold text-gray-700">{currentQuestion.answer}</p>
                  </div>
                )}


                {!isSubmitted && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                      onClick={handleSubmit}
                    >
                      Submit
                    </button>
                    {currentQuestion.hint && (
                      <button
                        className="text-indigo-600 underline text-sm"
                        onClick={() => setShowHint(true)}
                      >
                        Need a Hint?
                      </button>
                    )}
                  </div>
                )}

                {isSubmitted && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {isCorrect && <Confetti width={window.innerWidth} height={window.innerHeight} />}

                    {currentQuestionIndex < questions.length - 1 && (
                      <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        onClick={handleNext}
                      >
                        Next Question
                      </button>
                    )}

                    {/* Display +25 for correct answer */}
                    {showBonus && (
                      <div className="text-green-600 text-2xl font-bold animate-pulse">
                        +10 Insights
                      </div>
                    )}

                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 sm:ml-auto"
                      onClick={() => setShowExplanation(true)}
                    >
                      Explain
                      <IonIcon icon={arrowForwardOutline} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500">No questions available for today.</p>
            )}
          </div>
        </div>
        {/* Explanation Sidebar (conditionally shown) */}
        {showExplanation && (
          <div className="w-full lg:w-1/3 p-6 bg-white rounded-2xl shadow-xl space-y-4 slide-in-right">
            <h2 className="text-xl font-bold text-indigo-700">Explanation</h2>
            <p className="text-sm text-gray-700">{currentQuestion?.solution}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
