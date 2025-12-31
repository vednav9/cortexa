import React from "react";
import GenericPage from "./GenericPage";
import { HiSparkles } from "react-icons/hi";

export default function AIChatbot() {
    return (
        <GenericPage
            title="AI Chatbot Personal"
            description="Your personal AI assistant for learning"
            icon={HiSparkles}
            requiresAccess={true}
        />
    );
}
