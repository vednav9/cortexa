import React from "react";
import GenericPage from "../shared/GenericPage";
import { FiUpload } from "react-icons/fi";

export default function UploadNotes() {
    return (
        <GenericPage
            title="Upload Notes"
            description="Share study materials with your students"
            icon={FiUpload}
            requiresAccess={true}
        />
    );
}
