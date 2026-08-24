import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

import Dashboard from "../pages/Dashboard/Dashboard";
import Library from "../pages/Library/Library";
import Tutor from "../pages/Tutor/Tutor";
import Quiz from "../pages/Quiz/Quiz";
import Flashcards from "../pages/Flashcards/Flashcards";
import Analytics from "../pages/Analytics/Analytics";
import Planner from "../pages/Planner/Planner";
import Exam from "../pages/Exam/Exam";
import MaterialDetails from "../pages/Library/MaterialDetails";
import LearningLibrary from "../pages/Library/LearningLibrary";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                <Route element={<AppLayout />}>

                    <Route path="/" element={<Dashboard />} />

                    <Route path="/library" element={<Library />} />

                    <Route path="/library" element={<LearningLibrary />} />

                    <Route path="/library/material/:id" element={<MaterialDetails />} />

                    <Route path="/tutor" element={<Tutor />} />

                    <Route path="/quiz" element={<Quiz />} />

                    <Route path="/flashcards" element={<Flashcards />} />

                    <Route path="/analytics" element={<Analytics />} />

                    <Route path="/planner" element={<Planner />} />

                    <Route path="/exam" element={<Exam />} />

                </Route>

            </Routes>
        </BrowserRouter>
    );
}