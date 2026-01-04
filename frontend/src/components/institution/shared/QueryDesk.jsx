import React, { useContext } from "react";
import { useOutletContext } from "react-router-dom";
import { InstitutionContext } from "../../../context/InstitutionContext";
import DashboardQueryDesk from "../../dashboard/QueryDesk";

export default function QueryDesk() {
    const { hasAccess } = useOutletContext();
    const { institution } = useContext(InstitutionContext);

    // Use the dashboard QueryDesk component with institution context
    return <DashboardQueryDesk institution={institution} />;
}
