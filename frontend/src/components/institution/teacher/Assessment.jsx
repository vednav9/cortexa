import React from "react";
import GenericPage from "../shared/GenericPage";
import { FiClipboard } from "react-icons/fi";

export default function Assessment() {
    return (
        <GenericPage
            title="Assessment"
            description="View and manage assessments"
            icon={FiClipboard}
            requiresAccess={true}
        />
    );
}
