import React from "react";
import GenericPage from "../shared/GenericPage";
import { FiCheckSquare } from "react-icons/fi";

export default function GenerateMCQ() {
    return (
        <GenericPage
            title="Generate MCQs"
            description="Create multiple choice questions using AI"
            icon={FiCheckSquare}
            requiresAccess={true}
        />
    );
}
