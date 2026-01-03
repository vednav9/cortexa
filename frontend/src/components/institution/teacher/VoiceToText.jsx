import React from "react";
import GenericPage from "../shared/GenericPage";
import { FiMic } from "react-icons/fi";

export default function VoiceToText() {
    return (
        <GenericPage
            title="Voice-to-Text"
            description="Convert voice lectures to text notes"
            icon={FiMic}
            requiresAccess={true}
        />
    );
}
