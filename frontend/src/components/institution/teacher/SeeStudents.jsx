import React from "react";
import GenericPage from "../shared/GenericPage";
import { FiUsers } from "react-icons/fi";

export default function SeeStudents() {
    return (
        <GenericPage
            title="See Students"
            description="View and manage your students"
            icon={FiUsers}
            requiresAccess={true}
        />
    );
}
