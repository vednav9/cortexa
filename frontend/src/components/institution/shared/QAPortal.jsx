import React from "react";
import GenericPage from "./GenericPage";
import { FiMessageSquare } from "react-icons/fi";

export default function QAPortal() {
    return (
        <GenericPage
            title="Q&A Portal"
            description="Ask questions and get answers"
            icon={FiMessageSquare}
            requiresAccess={true}
        />
    );
}
