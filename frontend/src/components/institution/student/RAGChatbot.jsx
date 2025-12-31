import React from "react";
import GenericPage from "../shared/GenericPage";
import { FiBook } from "react-icons/fi";

export default function RAGChatbot() {
    return (
        <GenericPage
            title="RAG Chatbot"
            description="Chat with AI about your course materials"
            icon={FiBook}
            requiresAccess={true}
        />
    );
}
